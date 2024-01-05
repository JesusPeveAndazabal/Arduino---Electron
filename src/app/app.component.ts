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
  template: `<div *ngIf="valorWatterflow !== undefined">Watterflow - Caudal: {{ valorWatterflow }}</div>
  <div *ngIf="valorVolumen !== undefined"> Volumen: {{ valorVolumen }}</div>
  <div *ngIf="valorGPS !== undefined"> Gps: {{ valorGPS }}</div>
  <div *ngIf="valorVelocidad !== undefined"> Velocidad: {{ valorVelocidad }}</div> 
   
  <div>
    <label for="minVolume">Volumen Mínimo:</label>
    <input type="number" id="minVolume" [(ngModel)]="minVolume" />
  </div>

  <div>
    <label for="currentVolume">Volumen Actual en el Tanque:</label>
    <input type="number" id="currentVolume" [(ngModel)]="currentVolume" />
  </div>

  <div>
    <button (click)="calcularVolumenReal()">Calcular Volumen Real</button>
  </div>
  <div>
    <div>
      <button (click)="toggleValvulaIzquierda()">
        <i [class]="izquierdaActivada ? 'fas fa-lock-open' : 'fas fa-lock'"></i>
        {{ izquierdaActivada ? 'Desactivar' : 'Activar' }} Izquierda
      </button>
    </div>
  
    <div>
      <button (click)="toggleValvulaDerecha()">
        <i [class]="derechaActivada ? 'fas fa-lock-open' : 'fas fa-lock'"></i>
        {{ derechaActivada ? 'Desactivar' : 'Activar' }} Derecha
      </button>
    </div>
  </div>
  <div *ngIf="valorPressure !== undefined">Presión: {{ valorPressure }} bares</div>
  
  <div>
    <label for="inputPressure">Ingresar Presión:</label>
    <input type="number" id="inputPressure" [(ngModel)]="inputPressureValue" />
    <button (click)="regulatePressure()">Regulación de Presión</button>
  </div>
  
  `
            ,
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
      // Formatear el número con dos decimales antes de enviarlo al Arduino
      const formattedValue = this.inputPressureValue.toFixed(2);
      
      // Imprimir el valor formateado en la consola para verificar
      console.log('Valor formateado:', formattedValue);
  
      // Llamar a la función del servicio para regular la presión con el valor ingresado
      this.arduinoService.regulatePressureWithBars(parseFloat(formattedValue));
  
      // Limpiar el campo de entrada después de enviar el comando
      this.inputPressureValue = undefined;
    }
  }
  
  calcularVolumenReal(): void {
    const sensor = 5; // Ajusta este valor según tu lógica de obtención del sensor
    this.currentRealVolume = this.currentRealVolume - this.currentVolume;
    const value = this.currentRealVolume;

    // Verificar si el volumen real actual pasó el límite y cerrar las válvulas
    if (this.currentRealVolume <= this.minVolume) {

      //Se cierra las valulva
      this.arduinoService.deactivateLeftValve();
      this.arduinoService.deactivateRightValve();
      // Lógica para detener las válvulas y enviar alertas...
      this.toastr.info('ADVERTENCIA', 'RECARGUE EL TANQUE', {
        timeOut: 2000,
      });

      // También puedes emitir eventos o llamar a otras funciones aquí.
    }

    // Otro código relacionado con el volumen...
  }

 /*  regulatePressure(): void {
    const inputValue = this.formulario.controls.inputValue.value;
    if (inputValue !== null && inputValue !== '') {
      const psi = parseFloat(inputValue);
      if (!isNaN(psi)) {
        // Realiza la conversión de unidades
        const minPresion = 5;
        const maxPresion = 15;
        //const valorEnBares = convertPressureUnit(maxPresion, original_unit=UnitPressureEnum(int()));
        //console.log("Valor" , valorEnBares);
        //this.arduinoService.regulatePressureWithBars(valorEnBares);
      }
    }
  } */
  
  async ngOnInit() {

    

    //this.arduinoService.read_devices();
    
    // En algún lugar de tu aplicación donde desees ajustar la presión
    //this.arduinoService.regulatePressureWithBars(0.30); // Reemplaza 3.0 con el valor deseado
    
    //CAUDAL 
    this.arduinoService.getSensorObservable(Sensor.WATER_FLOW).subscribe((valorDelSensor) => {
      //this.arduinoService.notifySensorWatterflow(Sensor.WATER_FLOW , valorDelSensor);
      this.valorWatterflow = valorDelSensor;
      
      //Forzar la vista de angular
      this.cdr.detectChanges();
      this.arduinoService.notifySensorWatterflow(Sensor.WATER_FLOW , valorDelSensor);
      
      // Actualizar la interfaz de usuario u realizar acciones adicionales aquí
    });

    //VOLUMEN
    this.arduinoService.getSensorObservable(Sensor.VOLUME).subscribe((valorDelSensor) => {
      //console.log('Nuevo valor del sensor Volumen:', valorDelSensor);
      this.valorVolumen = valorDelSensor;

      //Forzar la vista de angular
      this.cdr.detectChanges();
      
      // Actualizar la interfaz de usuario u realizar acciones adicionales aquí
    });

    //PH
    this.arduinoService.getSensorObservable(Sensor.PH).subscribe((valorDelSensor) => {
      //console.log('Nuevo valor del sensor PH', valorDelSensor);
      this.valorPH = valorDelSensor;
      //Forzar la vista de angular
      this.cdr.detectChanges();
      // Actualizar la interfaz de usuario u realizar acciones adicionales aquí
    });

    //TEMPERATURA
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

    //Pressure - presion
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
