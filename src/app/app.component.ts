import { Component, OnInit } from '@angular/core';
import { ElectronService } from './core/services';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../environments/environment';
import { ReadlineParser } from '@serialport/parser-readline'

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

@Component({
  selector: 'app-root',
  template: `<div *ngIf="valorWatterflow !== undefined">Valor del sensor Watterflow: {{ valorWatterflow }}</div>
             <div *ngIf="valorVolumen !== undefined">Valor del sensor Volumen: {{ valorVolumen }}</div>
             <div *ngIf="valorPH !== undefined">Valor del sensor PH: {{ valorPH }}</div>
             <div *ngIf="valorTemperatura !== undefined">Valor del sensor Temperatura: {{ valorTemperatura }}</div>`
            ,
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit{
  valorWatterflow: number | undefined; 
  valorVolumen: number | undefined; 
  valorPH: number | undefined; 
  valorTemperatura: number | undefined; 
  private sensorSubscription: Subscription | undefined;

  constructor(private arduinoService : ArduinoService, private cdr: ChangeDetectorRef , private dataService : DatabaseService) {
  }
  ngOnInit() {

    //Creacion de la base de datos - SQLite
    this.dataService.openConnection().then((db) => {
      console.log('Base de datos creada correctamente:', db);
      // Realiza acciones adicionales si es necesario
    }).catch((error) => {
      console.error('Error al crear la base de datos:', error);
    });

    this.arduinoService.getSensorObservable(Sensor.WATER_FLOW).subscribe((valorDelSensor) => {
      console.log('Nuevo valor del sensor watterflow:', valorDelSensor);
      this.valorWatterflow = valorDelSensor;

      //Forzar la vista de angular
      this.cdr.detectChanges();
      
      // Actualizar la interfaz de usuario u realizar acciones adicionales aquí
    });

    this.arduinoService.getSensorObservable(Sensor.VOLUME).subscribe((valorDelSensor) => {
      console.log('Nuevo valor del sensor Volumen:', valorDelSensor);
      this.valorVolumen = valorDelSensor;

      //Forzar la vista de angular
      this.cdr.detectChanges();
      
      // Actualizar la interfaz de usuario u realizar acciones adicionales aquí
    });

    this.arduinoService.getSensorObservable(Sensor.PH).subscribe((valorDelSensor) => {
      console.log('Nuevo valor del sensor PH', valorDelSensor);
      this.valorPH = valorDelSensor;
      //Forzar la vista de angular
      this.cdr.detectChanges();
      // Actualizar la interfaz de usuario u realizar acciones adicionales aquí
    });

    this.arduinoService.getSensorObservable(Sensor.TEMPERATURE).subscribe((valorDelSensor) => {
      console.log('Nuevo valor del sensor Temperatura', valorDelSensor);
      this.valorTemperatura = valorDelSensor;
      //Forzar la vista de angular
      this.cdr.detectChanges();
      // Actualizar la interfaz de usuario u realizar acciones adicionales aquí
    });
  }

  ngOnDestroy() {
    // Desinscribirse para evitar pérdidas de memoria
    if (this.sensorSubscription) {
      this.sensorSubscription.unsubscribe();
    }
  }
}
