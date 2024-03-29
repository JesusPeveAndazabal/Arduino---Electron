// arduino.service.ts
import { Injectable } from '@angular/core';
import { ToastrService ,IndividualConfig } from 'ngx-toastr';
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
import { start } from 'repl';

//Este se comporta como el device_manager

@Injectable({
  providedIn: 'root',
})

export class ArduinoService {
  listArduinos : ArduinoDevice[] = [];

  // arduino1! : ArduinoDevice;
  // arduino2! : ArduinoDevice;
  // arduino3! : ArduinoDevice;
  
  current_volume = 0;
  current_real_volume = 0;
  min_volumen = 0;

  timer: any;
  currentTime: number = 0;


  cronometroActivo: boolean = false;
  tiempoProductivo: number = 0;
  tiempoImproductivo: number = 0;
  inicioTiempoProductivo: number = 0;
  inicioTiempoImproductivo: number = 0;


  // Valores iniciales y mínimos del contenedor
  private nivelInicial: number = 100; // Valor inicial del contenedor
  private nivelMinimo: number = 20;   // Valor mínimo del contenedor para mostrar alerta
 
   // Otros atributos necesarios para tu lógica
  private currentRealVolume: number = this.nivelInicial; // Inicializa con el valor inicial


  detail_number = 0;
  DEBUG = true;
  devicesCant : string[] = [];
  //messages_from_device = [];

  private messageInterval:any;

  private last_date = new Date(); 
  private currentVolume: number = 100.0; // Volumen inicial en litros
  private minVolume: number = 10.0; // Volumen mínimo deseado en litros

  izquierdaActivada = false;
  derechaActivada = false;

  isRunning: boolean = false;
  
  timerProductive: any;
  currentTimeProductive: number = 0;

  timerImproductive: any;
  currentTimeImproductive: number = 0;

  inputPressureValue: number | undefined;

  
  private sensorSubjectMap: Map<Sensor, Subject<Sensor>> = new Map();
 
  constructor( private electronService: ElectronService , private databaseService : DatabaseService , private toastr : ToastrService) {
    this.setupSensorSubjects();
    
    // this.arduino1 = new ArduinoDevice("COM30",115200,true,electronService,this); //CAUDAL-VOLUMEN
    // this.arduino2 = new ArduinoDevice("COM36",115200,true,electronService,this);  //VALVULAS - PRESION
    // this.arduino3 = new ArduinoDevice("COM29",115200,true,electronService,this);  //GPS - VELOCIDAD
  }

  findBySensor(sensor : number): ArduinoDevice{
    return this.listArduinos.find(p => p.sensors.some(x => x == sensor))!;
  }

  inicializarContenedor(inicial: number, minimo: number): void {
    this.nivelInicial = inicial;
    this.currentRealVolume = inicial;
    this.nivelMinimo = minimo;
  }

    //Metodo para enviar el valor de presion que se le asignara
    public regulatePressureWithBars(bars: number): void {
      const regulatorId = Sensor.PRESSURE_REGULATOR;
      
      // Convertir el valor de bares según sea necesario, por ejemplo, asumamos que está en la misma unidad que se usó en el script original
      const barPressure = bars;
      
      //console.log('Enviando comando de regulación de presión...', barPressure);
  
      // Aquí deberías incluir la lógica para enviar el comando al dispositivo, por ejemplo:
      this.findBySensor(regulatorId).sendCommand(`${regulatorId}|${barPressure.toFixed(1)}`);
    }
 
    //Metodo para resetear el volumen inicial y minimo
    public resetVolumenInit(): void {
      const command = 'B';
      this.findBySensor(Sensor.VOLUME).sendCommand(command);
    }

    // Método para activar la válvula izquierda
    public activateLeftValve(): void {
      const command = Sensor.VALVE_LEFT + '|1\n'; // Comando para activar la válvula izquierda
      this.findBySensor(Sensor.VALVE_LEFT).sendCommand(command);
    }
  
    // Método para desactivar la válvula izquierda
    public deactivateLeftValve(): void {
      const command = Sensor.VALVE_LEFT  + '|0\n'; // Comando para desactivar la válvula izquierda
      this.findBySensor(Sensor.VALVE_LEFT).sendCommand(command);
    }
  
    // Método para activar la válvula derecha 
    public activateRightValve(): void {
      const command = Sensor.VALVE_RIGHT + '|1\n'; // Comando para activar la válvula derecha
      this.findBySensor(Sensor.VALVE_RIGHT).sendCommand(command);
    }
  
    // Método para desactivar la válvula derecha
    public deactivateRightValve(): void {
      const command = Sensor.VALVE_RIGHT + '|0\n'; // Comando para desactivar la válvula derecha
      this.findBySensor(Sensor.VALVE_RIGHT
        ).sendCommand(command);
    }
    
    //Fucnion para abrir y cerrar electrovalvulas
    toggleValvulaDerecha():void{
      this.derechaActivada = !this.derechaActivada;
  
      if(this.derechaActivada){
        this.activateRightValve();
      }else{
        this.deactivateRightValve();
      }
    
    }

      //Activar y desacctivar la valvulas izquierda
    toggleValvulaIzquierda():void{
      this.izquierdaActivada = !this.izquierdaActivada;

      if(this.izquierdaActivada){
        this.activateLeftValve();
      }else{
        this.deactivateLeftValve();
      }
    }

    //Regular la presion
    regulatePressure(): void {
      if (this.inputPressureValue !== undefined) {
        console.log(this.inputPressureValue);
      this.regulatePressureWithBars(this.inputPressureValue);
      }
    } 

    //Limpiar datos el arduino mediante el comando
    resetVolumen(): void {
      this.resetVolumenInit();
      this.minVolume = 0;
      this.currentVolume = 0;
    }

   
    IniciarApp(valorWatterflow : number): void {
      console.log("Ingreso a la funcion iniciarApp")
      if (this.isRunning && valorWatterflow > 0) {
        console.log("Ingreso a la condicion si es true la varibale isRunning")
        this.resumeTimerProductive();
        this.pauseTimerImproductive();
        console.log("valor del caudal", valorWatterflow);
      } else if(valorWatterflow <= 0){
        console.log("Ingreso al else if si es false la variable y esta menos dee 0")
        //this.isRunning = false;
        this.resumeTimerImproductive();
        this.pauseTimerProductive();
      }
    }

      //Pausar tiempo productivo
    pauseTimerProductive(): void {
      clearInterval(this.timerProductive);
    }

    //Pausar tiempo Improductivo
    pauseTimerImproductive(): void {
      clearInterval(this.timerImproductive);
    }

    //Reanudar tiempo productivo
    resumeTimerProductive(): void {
      this.startTimerProductive();
    }

    //Reanudar tiempo Improductivo
    resumeTimerImproductive(): void {
      this.startTimerImproductive();
    }

    //Fucnion para tiempo productivo
    startTimerProductive(): void {
      console.log("Ingreso a la funcion de star time productive");
      this.timerProductive = setInterval(() => {
        this.currentTimeProductive++;
      }, 1000);
    }
  
    //Funcion para tiempo improductivo
    startTimerImproductive(): void {
      this.timerImproductive = setInterval(() => {
        this.currentTimeImproductive++;
      }, 1000);
    }
    
    formatTime(seconds: number): string {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;
  
      const formattedHours = hours < 10 ? `0${hours}` : hours;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds;
      console.log("Formato de formatTime" , `${formattedHours}:${formattedMinutes}:${formattedSeconds}`);
      return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    
    }
  
    
    // Esta función se puede llamar cuando se detiene la aplicación para guardar el tiempo actual
    saveCurrentTime(): void {
      // Puedes almacenar this.currentTime en algún lugar, como en el almacenamiento local
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
 /*  public notifySensorWatterflow(sensor: Sensor, val: number) {
    if (sensor === Sensor.WATER_FLOW && val > 0) {
      // Calcula la reducción de volumen en función del caudal
      const volumeReduction = val * 60.0 / 1000.0; // Convierte el caudal de mL/s a litros/minuto
      
      // Actualiza el volumen actual
      this.currentVolume -= volumeReduction;

      if (this.currentVolume < this.minVolume) {
        // Realiza acciones adicionales cuando el volumen alcanza el mínimo
        console.log('Volumen mínimo alcanzado');
        // Puedes realizar otras acciones o detener el flujo según tus necesidades
      }

      // También puedes emitir eventos o notificar sobre cambios en el volumen
      this.notifyVolumeChange(this.currentVolume);
    }
  } */

 /*  private notifyVolumeChange(volume: number): void {
    // Emite un evento o realiza acciones cuando cambia el volumen
    console.log(`Volumen actual: ${volume} litros`);
  } */
  
}
