import { Component, OnInit } from '@angular/core';
import { ElectronService } from './core/services';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../environments/environment';
import { ReadlineParser } from '@serialport/parser-readline'
import { FormControl, FormGroup } from '@angular/forms';
import { ToastrService ,IndividualConfig } from 'ngx-toastr';
// Importa NgModel para poder utilizar [(ngModel)]
import { NgModel } from '@angular/forms';
//Utils
import { Configuration, Mode, UnitPressure, UnitPressureEnum, convertPressureUnit } from './core/utils/global';
import { SerialPort } from 'serialport';
import { NONE_TYPE } from '@angular/compiler';
import * as path from 'path';
import { ArduinoService } from './core/services/arduino/arduino.service';
import { RealTimeDataService}  from './core/services/prueba/real-time-data.service'
import { Subscription } from 'rxjs';
import { ArduinoDevice } from './core/services/arduino/arduino.device'; 
import { Sensor } from './core/utils/global';
import { ChangeDetectorRef } from '@angular/core';
import { DatabaseService } from './core/services/database/database.service';
import { Product } from './core/models/product';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit{
  valorWatterflow: number = 0; 
  valorVolumen: number | undefined; 
  valorPH: number | undefined; 
  valorGPS: number | undefined; 
  valorVelocidad: number | undefined; 
  valorTemperatura: number | undefined; 
  valorPressure: number | undefined; 
  private sensorSubscription: Subscription | undefined;
  izquierdaActivada = false;
  derechaActivada = false;
  

  minVolume: number = 0;
  currentVolume: number = 0;
  currentRealVolume: number = 0;

  cronometroProductivo: number = 0;
  cronometroImproductivo: number = 0;
  enModoProductivo: boolean = false;
  velocidadCronometro: number = 1;

  botonEncendido: boolean = false;


  isRunning: boolean = false;
  
/*   timerProductive: any;
  currentTimeProductive: number = 0;

  timerImproductive: any;
  currentTimeImproductive: number = 0; */

  valorWatterflowMenor0 : number = 0;
  valorWatterflowMayor0 : number = 0;
  

  // Nuevos valores para el contenedor
  nivelInicial: number = 100;
  nivelMinimo: number = 20;

  inputLitrosValue: number | undefined;

  inputPressureValue: number | undefined; 

  


  formulario = new FormGroup({
    inputValue: new FormControl(''), // Puedes proporcionar un valor inicial aquí si lo deseas
  });



  constructor(private arduinoService : ArduinoService, private cdr: ChangeDetectorRef , private databaseService : DatabaseService , private toastr: ToastrService) {
  }
  
  async ngOnInit() {

    this.arduinoService.inicializarContenedor(this.nivelInicial , this.nivelMinimo);

    //this.arduinoService.read_devices();
    
    // En algún lugar de tu aplicación donde desees ajustar la presión
    //this.arduinoService.regulatePressureWithBars(0.30); // Reemplaza 3.0 con el valor deseado
     


    //VOLUMEN
    this.arduinoService.getSensorObservable(Sensor.VOLUME).subscribe((valorDelSensor) => {
      //console.log('Nuevo valor del sensor Volumen:', valorDelSensor);
      this.valorVolumen = this.currentVolume - valorDelSensor;

      if (this.valorVolumen < this.minVolume){
        this.toastr.warning("Debe rellenar el tanque - Valvulas cerradas");
        this.arduinoService.deactivateRightValve();
        this.arduinoService.deactivateLeftValve();
        //this.toggleValvulaDerecha();
        //this.toggleValvulaIzquierda();
      }

      //this.currentVolume = this.currentVolume - this.valorVolumen;


      //Forzar la vista de angular
      this.cdr.detectChanges();
  
    });

    //PH -- POR EL MOMENTO NO SE USARA 
    this.arduinoService.getSensorObservable(Sensor.PH).subscribe((valorDelSensor) => {
      //console.log('Nuevo valor del sensor PH', valorDelSensor);
      this.valorPH = valorDelSensor;
      //Forzar la vista de angular
      this.cdr.detectChanges();
      // Actualizar la interfaz de usuario u realizar acciones adicionales aquí
    });

    //TEMPERATUR
    this.arduinoService.getSensorObservable(Sensor.TEMPERATURE).subscribe((valorDelSensor) => {
      //console.log('Nuevo valor del sensor Temperatura', valorDelSensor);
      this.valorTemperatura = valorDelSensor;
      //Forzar la vista de angular
      this.cdr.detectChanges();
      // Actualizar la interfaz de usuario u realizar acciones adicionales aquí
    });

    //GPS
    this.arduinoService.getSensorObservable(Sensor.GPS).subscribe((valorDelSensor) => {
      //console.log("GPS",valorDelSensor);
      this.valorGPS = valorDelSensor;
      this.cdr.detectChanges();
    });

    //SPEED - VELOCIDAD
    this.arduinoService.getSensorObservable(Sensor.SPEED).subscribe((valorDelSensor) => {
      //console.log("",valorDelSensor);
      this.valorVelocidad = valorDelSensor;
      this.cdr.detectChanges();
    });

    //PRESSURE - PRESION
    this.arduinoService.getSensorObservable(Sensor.PRESSURE).subscribe((valorDelSensor) => {
      console.log("Valor de la presion" , valorDelSensor);
      this.valorPressure = valorDelSensor;
      this.cdr.detectChanges();
    });    

  }

  toggleBotonEncendido() {
    this.botonEncendido = !this.botonEncendido;
    console.log("Impresion" ,this.botonEncendido);
    if (!this.botonEncendido) {
      console.log("Ingreso a la condicional de formateo de valores ");
      // Si el botón se apaga, reiniciar todos los valores relacionados con los cronómetros
      this.cronometroProductivo = 0;
      this.cronometroImproductivo = 0;
      this.enModoProductivo = false;
      //this.ultimoTiempoProductivo = 0;
    }

    if(this.botonEncendido){
      this.iniciarCronometro();
    }
  }

  iniciarCronometro(){
    if (!this.botonEncendido){
      console.log("Ingreso a la condicional de boton encendido")
      return;
    }

    console.log("Seguimiento del script");
    
    //CAUDAL 
    this.arduinoService.getSensorObservable(Sensor.WATER_FLOW).subscribe((valorDelSensor) => {
      //this.arduinoService.notifySensorWatterflow(Sensor.WATER_FLOW , valorDelSensor);
      this.valorWatterflow = valorDelSensor;

      if (this.valorWatterflow > 0 && !this.enModoProductivo) {
        // Cambio a modo productivo solo si venía de modo improductivo
        this.enModoProductivo = true;
      } else if (this.valorWatterflow <= 0 && this.enModoProductivo) {
        // Cambio a modo improductivo solo si venía de modo productivo
        this.enModoProductivo = false;
      } else {
        // Continuar en el modo actual
        if (this.enModoProductivo) {0
          this.cronometroProductivo += this.velocidadCronometro;
        } else {
          this.cronometroImproductivo += this.velocidadCronometro;
        }
      }

     //Forzar la vista de angular
      this.cdr.detectChanges();
    });
  }

  toggleValvulaDerecha():void{
    this.arduinoService.toggleValvulaDerecha();
  }

  //Activar y desacctivar la valvulas izquierda
  toggleValvulaIzquierda():void{
    this.arduinoService.toggleValvulaIzquierda();
  }

  regulatePressure(){
    this.arduinoService.inputPressureValue = this.inputPressureValue;
    this.arduinoService.regulatePressure();
  }

  resetVolumen(): void {
    this.arduinoService.resetVolumen();
  }
/* 
  //Pausar tiempo productivo
  pauseTimerProductive(): void {
    clearInterval(this.timerProductive);
    this.isRunning = false;
  }

  //Pausar tiempo Improductivo
  pauseTimerImproductive(): void {
    clearInterval(this.timerImproductive);
    this.isRunning = true;
  }

  //Reanudar tiempo productivo
  resumeTimerProductive(): void {
    this.startTimerProductive();
  }

   //Reanudar tiempo Improductivo
  resumeTimerImproductive(): void {
    this.startTimerImproductive();
  }

  //Reiniciar tiempo productivo
  resetTimerProductive(): void {
    this.currentTimeProductive = 0;
  }

   //Reiniciar tiempo Improductivo
   resetTimerImproductive(): void {
    this.currentTimeImproductive = 0;
  }

  //Fucnion para tiempo productivo
  startTimerProductive(): void {
    this.timerProductive = setInterval(() => {
      this.currentTimeProductive++;
    }, 1000);
    this.isRunning = true;
  }

  //Funcion para tiempo improductivo
  startTimerImproductive(): void {
    this.timerImproductive = setInterval(() => {
      this.currentTimeImproductive++;
    }, 1000);
    this.isRunning = false;
  } */

  // Método para formatear segundos a HH:mm:ss
  formatearTiempo(segundos: number): string {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segundosRestantes = segundos % 60;

    return `${this.agregarCeros(horas)}:${this.agregarCeros(minutos)}:${this.agregarCeros(segundosRestantes)}`;
  }

  // Método para agregar ceros a los valores menores a 10
  private agregarCeros(valor: number): string {
    return valor < 10 ? `0${valor}` : `${valor}`;
  }  



  ngOnDestroy() {
    // Desinscribirse para evitar pérdidas de memoria
    if (this.sensorSubscription) {
      this.sensorSubscription.unsubscribe();
    }
  }
}
