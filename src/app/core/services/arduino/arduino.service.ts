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


  arduino1! : ArduinoDevice;
  arduino2! : ArduinoDevice;
  arduino3! : ArduinoDevice;

  private work : any;
  private firstRun : boolean = false;

  private work_first_started : boolean = false;
  
  /* config: Config | null = null; */

  current_volume = 0;
  current_real_volume = 0;
  min_volumen = 0;


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


  private tiempoProductivoInterval: any; // Intervalo para actualizar el contador productivo
  private tiempoImproductivoInterval: any; // Intervalo para actualizar el contador improductivo

  // Modifica la declaración de tiempoProductivo y tiempoImproductivo
  tiempoProductivo: Date = new Date(0);
  tiempoImproductivo: Date = new Date(0);
 


  inputPressureValue: number | undefined;

  
  private sensorSubjectMap: Map<Sensor, Subject<Sensor>> = new Map();
 
  constructor( private electronService: ElectronService , private databaseService : DatabaseService , private toastr : ToastrService) {
    this.setupSensorSubjects();
    
    this.arduino1 = new ArduinoDevice("COM33",115200,true,electronService,this); //CAUDAL-VOLUMEN
    this.arduino2 = new ArduinoDevice("COM34",115200,true,electronService,this);  //VALVULAS - PRESION
    //this.arduino3 = new ArduinoDevice("COM29",115200,true,electronService,this);  //GPS - VELOCIDAD
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
      this.arduino2.sendCommand(`${regulatorId}|${barPressure.toFixed(1)}`);
    }
 
    //Metodo para resetear el volumen inicial y minimo
    public resetVolumenInit(): void {
      const command = 'B';
      this.arduino1.sendCommand(command);
    }

    // Método para activar la válvula izquierda
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

// Modifica la lógica de iniciarContadorProductivo
iniciarContadorProductivo(): void {
  this.tiempoProductivoInterval = setInterval(() => {
    // Añade un segundo al tiempoProductivo
    this.tiempoProductivo.setSeconds(this.tiempoProductivo.getSeconds() + 1);

    // Puedes almacenar el tiempo formateado en una variable si lo necesitas en otro lugar
    this.tiempoProductivoFormateado = this.formatoFechaHora(this.tiempoProductivo);
  }, 1000); // Actualiza el contador cada segundo
}

// Modifica la lógica de iniciarContadorImproductivo
iniciarContadorImproductivo(): void {
  this.tiempoImproductivoInterval = setInterval(() => {
    // Añade un segundo al tiempoImproductivo
    this.tiempoImproductivo.setSeconds(this.tiempoImproductivo.getSeconds() + 1);

    // Puedes almacenar el tiempo formateado en una variable si lo necesitas en otro lugar
    this.tiempoImproductivoFormateado = this.formatoFechaHora(this.tiempoImproductivo);
  }, 1000); // Actualiza el contador cada segundo
}

// Función para formatear el objeto Date como "HH:mm:ss"
formatoFechaHora(fecha: Date): string {
  const horas = fecha.getUTCHours();
  const minutos = fecha.getUTCMinutes();
  const segundos = fecha.getUTCSeconds();
  return `${this.formatoDosDigitos(horas)}:${this.formatoDosDigitos(minutos)}:${this.formatoDosDigitos(segundos)}`;
}

// Función para agregar un cero delante si el valor es menor a 10
formatoDosDigitos(valor: number): string {
  return valor < 10 ? `0${valor}` : `${valor}`;
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
