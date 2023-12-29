// arduino.service.ts
import { Injectable } from '@angular/core';
import { SerialPort} from 'serialport'; 
import { ReadlineParser } from '@serialport/parser-readline'
import { ElectronService } from '../electron/electron.service';
import { ArduinoDevice } from './arduino.device';
import { Subject, Observable } from 'rxjs';
import { Sensor, SocketEvent, WorkStatusChange } from '../../utils/global';
import { DatabaseService  } from '../database/database.service';
import { Chronos , Config} from '../../utils/utils';
import { Database, sqlite3 } from 'sqlite3';
import { Product } from '../../models/product';
import { Queue } from 'queue-typescript'; 



//Este se comporta como el device_manager

@Injectable({
  providedIn: 'root',
})

export class ArduinoService {
  arduino1! : ArduinoDevice;
  arduino2! : ArduinoDevice;

  private work : any;
  private isRunning: boolean = false;
  private firstRun : boolean = false;

  private work_first_started : boolean = false;
  
  //Variables y funcion para calcular el tiempo de trabajo 
  working_time = new Chronos(0, 'working_time',false);
  downtime = new Chronos(0, 'downtime',false);

  config: Config | null = null;

  current_volume = 0;
  current_real_volume = 0;
  min_volumen = 50;

  detail_number = 0;
  DEBUG = true;

  private last_date = new Date();
  
  private sensorSubjectMap: Map<Sensor, Subject<Sensor>> = new Map();
 
  constructor( private electronService: ElectronService , private databaseService : DatabaseService ) {
    this.setupSensorSubjects();
    
    this.arduino1 = new ArduinoDevice("COM23",115200,true,electronService,this);
    this.arduino2 = new ArduinoDevice("COM4",115200,true,electronService,this); 
  }

/*   async getWorkFilter(){
    const sql = await this.databaseService.getWorkExecutionData();
    
    console.log(sql);
  } */

    async init (){
    try {
      const cronProd = new Chronos(0);
      const cronImprod = new Chronos(0);

      cronProd.start();

      setTimeout(() => {
        cronProd.update();
        console.log(`Tiempo productivo: ${cronProd.time()}`);
        cronProd.stop();

        cronImprod.start();

        setTimeout(() => {
          cronImprod.update(); 
          console.log(`Tiempo improductivo: ${cronImprod.time()}`);
          cronImprod.stop();

        },3000)

      },5000);
    } catch (error) {
      
    }
    }
    
    getMessage(): { [key: string]: number } {
      const message: { [key: string]: number } = {};
  
      // Utiliza la enumeración Sensor y su propiedad VALVE_LEFT
      for (const sensor in Sensor) {
        if (Sensor.hasOwnProperty(sensor)) {
          const x = Sensor[sensor];
  
          if (typeof x === 'number' && x  < Sensor.VALVE_LEFT) {
            message[`${x}`] = 0.0;
            console.log("Mensaje" , message)
          }
        }
      }
  
      return message;
    }



    // Método para activar la válvula izquierd
    public activateLeftValve(): void {
      const command = Sensor.VALVE_LEFT + '|1\n'; // Comando para activar la válvula izquierda
      this.arduino2.sendCommand(command);
    }
  
    // Método para desactivar la válvula izquierda
    public deactivateLeftValve(): void {
      const command = Sensor.VALVE_LEFT  + '|0\n'; // Comando para desactivar la válvula izquierda
      this.arduino2.sendCommand(command);
    }
  
    // Método para activar la válvula derecha 
    public activateRightValve(): void {
      const command = Sensor.VALVE_RIGHT + '|1\n'; // Comando para activar la válvula derecha
      this.arduino2.sendCommand(command);
    }
  
    // Método para desactivar la válvula derecha
    public deactivateRightValve(): void {
      const command = Sensor.VALVE_RIGHT + '|0\n'; // Comando para desactivar la válvula derecha
      this.arduino2.sendCommand(command);
    }
  

  async commands_from_client(){
    let items: number[] = [4, 5, 6, 7];
    let queue = new Queue<number>(...items);
    let result = queue.append(30);
    
    console.log("result: " + result);

  }

  //Este es el encargado de generar y emitir eventos de actualización
  private setupSensorSubjects(): void {
      // Crear Subject para cada tipo de sensor
    const sensorTypes: Sensor[] = Object.values(Sensor)
      .filter(value => typeof value === 'number') as Sensor[];

    sensorTypes.forEach((sensorType) => {
      this.sensorSubjectMap.set(sensorType, new Subject<number>());
    });
  }

  //Observa los eventos emitidos por el subject 
  public getSensorObservable(sensorType: Sensor): Observable<Sensor> {
    console.log("Se ejecuta est eevento getSerObservable");
    return this.sensorSubjectMap.get(sensorType)!.asObservable();
  }

  //Notifica si cambio el valor de los sensores
  public notifySensorValue(sensorType: Sensor, value: Sensor): void {
    //console.log(`Nuevo valor para ${sensorType}: ${value}`)
    if (this.sensorSubjectMap.has(sensorType)) {
      this.sensorSubjectMap.get(sensorType)!.next(value);
    }
  }

}
