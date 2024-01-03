// arduino.service.ts
import { Injectable } from '@angular/core';
import { SerialPort} from 'serialport'; 
import { ReadlineParser } from '@serialport/parser-readline'
import { ElectronService } from '../electron/electron.service';
import { ArduinoDevice } from './arduino.device';
import { Subject, Observable } from 'rxjs';
import { Sensor, SocketEvent, WorkStatusChange } from '../../utils/global';
import { DatabaseService  } from '../database/database.service';
import { Chronos , TimeTracker} from '../../utils/utils';
import { Database, sqlite3 } from 'sqlite3';
import { Product } from '../../models/product';
import { Queue } from 'queue-typescript';
import { Mode } from '../../utils/global'; 
import { devices } from 'playwright';



//Este se comporta como el device_manager

@Injectable({
  providedIn: 'root',
})

export class ArduinoService {

  //Variables y funcion para calcular el tiempo de trabajo 
/*   private cronProd = new Chronos(0);
  private cronImprod = new Chronos(0); */

  private timeTracker = new TimeTracker();

  
  arduino1! : ArduinoDevice;
  arduino2! : ArduinoDevice;

  private work : any;
  private isRunning: boolean = false;
  private firstRun : boolean = false;

  private work_first_started : boolean = false;
  

  

  /* config: Config | null = null; */

  current_volume = 0;
  current_real_volume = 0;
  min_volumen = 50;

  detail_number = 0;
  DEBUG = true;
  devicesCant : string[] = [];
  //messages_from_device = [];

  private messageInterval:any;

  private last_date = new Date(); 
  
  private sensorSubjectMap: Map<Sensor, Subject<Sensor>> = new Map();
 
  constructor( private electronService: ElectronService , private databaseService : DatabaseService ) {
    this.setupSensorSubjects();
    
    this.arduino1 = new ArduinoDevice("COM23",115200,true,electronService,this);
    this.arduino2 = new ArduinoDevice("COM6",115200,true,electronService,this); 
  }

/*     async init (){
      try {
     

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
    } */

    async read_devices(){
      let lastDate: Date = new Date();
      let message: { [key: string]: number } = {};
      for (const x of Object.values(Sensor)) {
          if (typeof x === 'number' && x < Sensor.VALVE_LEFT) {
              message[`${x}`] = 0.0;
          }
      }

      let instance = this;

      this.messageInterval = setInterval(function(){
        console.log("Ingreso a la funcion read_device");
        if (instance.devicesCant.length === 0){
          //console.log("Ingreso a la condicional");
          const readable_devices = instance.devicesCant.filter((x:any) => x.mode === Mode.ONLY_READ || x.mode === Mode.READ_WRITE);
          console.log("readabale :", readable_devices);

          // Asumiendo que message es un objeto en TypeScript
          const valorSensor: number = message[Sensor.WATER_FLOW];

          // Ahora, puedes usar valorSensor en tu condición
          const is_improductive: boolean = valorSensor < 1;
  
          console.log("Impresion del sensor de watterflow" , valorSensor);
          //console.log(is_improductive);
          if(is_improductive){
            console.log("Tiempo improductivo activado");
          }else{
            console.log("Tiempo productivo activado");
          }
          
        }
      },1000)
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

  //Notifica eventos del sensor de watterflow
  public notifySensorWatterflow(sensor: Sensor, val: number) {
    if (sensor === Sensor.WATER_FLOW && val < 1) {
      this.timeTracker.startUnproductiveTime();
      // Realiza acciones improductivas...
  
      // Detiene el tiempo improductivo
      this.timeTracker.stopUnproductiveTime();
  
      console.log(`Tiempo improductivo: ${this.timeTracker.getUnproductiveTime()}`);
    } else {
      this.timeTracker.startProductiveTime();
      // Realiza acciones productivas...
  
      // Detiene el tiempo productivo
      this.timeTracker.stopProductiveTime();
  
      console.log(`Tiempo productivo: ${this.timeTracker.getProductiveTime()}`);
    }
  }
  
}
