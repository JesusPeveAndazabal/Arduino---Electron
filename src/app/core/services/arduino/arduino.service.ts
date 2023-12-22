// arduino.service.ts
import { Injectable } from '@angular/core';
import { SerialPort} from 'serialport'; 
import { ReadlineParser } from '@serialport/parser-readline'
import { ElectronService } from '../electron/electron.service';
import { ArduinoDevice } from './arduino.device';
import { Subject, Observable } from 'rxjs';
import { Sensor } from '../../utils/global';
import { DatabaseService } from '../database/database.service';
import { Chronos , Config} from '../../utils/utils';
import { Database, sqlite3 } from 'sqlite3';



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
  min_volumen = 0;

  detail_number = 0;
  DEBUG = true;

  private db : any;
  
  private sensorSubjectMap: Map<Sensor, Subject<Sensor>> = new Map();
 
  constructor( private electronService: ElectronService , private databaseService : DatabaseService) {
    this.setupSensorSubjects();
    this.initialize()
    this.arduino1 = new ArduinoDevice("COM23",115200,true,electronService,this);
    this.arduino2 = new ArduinoDevice("COM4",115200,true,electronService,this); 
  }

  private async initialize() {
    try {
      // Utiliza la instancia de DatabaseService para abrir la conexión
      this.db = await this.databaseService.openConnection();
  
      // Realiza las operaciones de la base de datos, por ejemplo, consulta SELECT
      const query = "SELECT * FROM work_execution WHERE is_finished = 0";
  
      // Utiliza promesas para envolver la operación de consulta
      const rows = await new Promise<any[]>((resolve, reject) => {
        this.db.all(query, [], (err: any, rows: any) => {
          if (err) {
            console.error('Error executing query:', err);
            reject(err);
          } else {
            console.log("Acceso al query");
            resolve(rows);
          }
        });
      });
  
      console.log('Query result:', rows);
  
      // Realiza otras operaciones después de obtener los resultados de la consulta
      // ...
  
      // Cierra la conexión después de usarla
      await this.databaseService.closeDB();
  
    } catch (error) {
      console.error('Error during database initialization:', error);
    }
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
