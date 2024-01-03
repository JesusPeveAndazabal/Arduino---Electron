import { Component, OnInit } from '@angular/core';
import { ElectronService } from './core/services';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../environments/environment';
import { ReadlineParser } from '@serialport/parser-readline'
import { FormControl, FormGroup } from '@angular/forms';

//Utils
import { Configuration, Mode } from './core/utils/global';
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
  <div> Presion: 5% </div>
  
  <div>
    <input [formControl]="formulario.controls.inputValue" placeholder="Ingrese el valor de la presion" />
    <!-- Accede al valor usando formulario.controls.inputValue.value -->
  </div>
  
  <div>
    <div>
      <button (click)="toggleValvulaIzquierda()">
        {{ izquierdaActivada ? 'Desactivar' : 'Activar' }} Válvula Izquierda
      </button>
    </div>
  
    <div>
      <button (click)="toggleValvulaDerecha()">
        {{ derechaActivada ? 'Desactivar' : 'Activar' }} Válvula Derecha
      </button>
    </div>
  </div>`
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
  private sensorSubscription: Subscription | undefined;
  izquierdaActivada = false;
  derechaActivada = false;

  formulario = new FormGroup({
    inputValue: new FormControl(''), // Puedes proporcionar un valor inicial aquí si lo deseas
  });

  constructor(private arduinoService : ArduinoService, private cdr: ChangeDetectorRef , private databaseService : DatabaseService) {
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

  async ngOnInit() {

    //this.arduinoService.read_devices();

    

    this.arduinoService.getSensorObservable(Sensor.WATER_FLOW).subscribe((valorDelSensor) => {
      //this.arduinoService.notifySensorWatterflow(Sensor.WATER_FLOW , valorDelSensor);
      this.valorWatterflow = valorDelSensor;
      
      //Forzar la vista de angular
      this.cdr.detectChanges();
      this.arduinoService.notifySensorWatterflow(Sensor.WATER_FLOW , valorDelSensor);
      
      // Actualizar la interfaz de usuario u realizar acciones adicionales aquí
    });

    this.arduinoService.getSensorObservable(Sensor.VOLUME).subscribe((valorDelSensor) => {
      //console.log('Nuevo valor del sensor Volumen:', valorDelSensor);
      this.valorVolumen = valorDelSensor;

      //Forzar la vista de angular
      this.cdr.detectChanges();
      
      // Actualizar la interfaz de usuario u realizar acciones adicionales aquí
    });

    this.arduinoService.getSensorObservable(Sensor.PH).subscribe((valorDelSensor) => {
      //console.log('Nuevo valor del sensor PH', valorDelSensor);
      this.valorPH = valorDelSensor;
      //Forzar la vista de angular
      this.cdr.detectChanges();
      // Actualizar la interfaz de usuario u realizar acciones adicionales aquí
    });

    this.arduinoService.getSensorObservable(Sensor.TEMPERATURE).subscribe((valorDelSensor) => {
      //console.log('Nuevo valor del sensor Temperatura', valorDelSensor);
      this.valorTemperatura = valorDelSensor;
      //Forzar la vista de angular
      this.cdr.detectChanges();
      // Actualizar la interfaz de usuario u realizar acciones adicionales aquí
    });

    this.arduinoService.getSensorObservable(Sensor.GPS).subscribe((valorDelSensor) => {
      //console.log("GPS",valorDelSensor);
      this.valorGPS = valorDelSensor;
      this.cdr.detectChanges();
    });

    this.arduinoService.getSensorObservable(Sensor.SPEED).subscribe((valorDelSensor) => {
      //console.log("",valorDelSensor);
      this.valorVelocidad = valorDelSensor;
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
