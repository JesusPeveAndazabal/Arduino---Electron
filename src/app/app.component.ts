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
  products: Product[] = [];
  valorWatterflow: number | undefined; 
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

  toggleValvulaIzquierda():void{
    this.izquierdaActivada = !this.izquierdaActivada;

    if(this.izquierdaActivada){
      this.arduinoService.activateLeftValve();
    }else{
      this.arduinoService.deactivateLeftValve();
    }
  }

  toggleValvulaDerecha():void{
    this.derechaActivada = !this.derechaActivada;

    if(this.derechaActivada){
      this.arduinoService.activateRightValve();
    }else{
      this.arduinoService.deactivateRightValve();
    }
  
  }

  regulatePressure(): void {
    if (this.inputPressureValue !== undefined) {
      console.log(this.inputPressureValue);
     this.arduinoService.regulatePressureWithBars(this.inputPressureValue);
    }
  }

  resetVolumen(): void {
    this.arduinoService.resetVolumen();
  }

  
  async ngOnInit() {

    this.arduinoService.inicializarContenedor(this.nivelInicial , this.nivelMinimo);

    //this.arduinoService.read_devices();
    
    // En algún lugar de tu aplicación donde desees ajustar la presión
    //this.arduinoService.regulatePressureWithBars(0.30); // Reemplaza 3.0 con el valor deseado
    
    //CAUDAL 
    this.arduinoService.getSensorObservable(Sensor.WATER_FLOW).subscribe((valorDelSensor) => {
      //this.arduinoService.notifySensorWatterflow(Sensor.WATER_FLOW , valorDelSensor);
      this.valorWatterflow = valorDelSensor;
    
      
      // Calcula el volumen en tiempo real según el caudal real
      //this.currentVolume -= valorDelSensor; // Ajusta la lógica según tus necesidades
      
      //Forzar la vista de angular
      this.cdr.detectChanges();
      //this.arduinoService.notifySensorWatterflow(Sensor.WATER_FLOW , valorDelSensor);
      
      // Actualizar la interfaz de usuario u realizar acciones adicionales aquí
    });

    //VOLUMEN
    this.arduinoService.getSensorObservable(Sensor.VOLUME).subscribe((valorDelSensor) => {
      //console.log('Nuevo valor del sensor Volumen:', valorDelSensor);
      this.valorVolumen = this.currentVolume - valorDelSensor;

      if (this.valorVolumen < this.minVolume){
        this.arduinoService.deactivateRightValve();
        this.arduinoService.deactivateLeftValve();
        this.toastr.info("Debe llenar el tanque - Valvulas cerradas");
      }

      //this.currentVolume = this.currentVolume - this.valorVolumen;


      //Forzar la vista de angular
      this.cdr.detectChanges();
      
      // Actualizar la interfaz de usuario u realizar acciones adicionales aquí
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


  ngOnDestroy() {
    // Desinscribirse para evitar pérdidas de memoria
    if (this.sensorSubscription) {
      this.sensorSubscription.unsubscribe();
    }
  }
}
