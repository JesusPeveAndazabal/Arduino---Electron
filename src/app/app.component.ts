import { Component, OnInit } from '@angular/core';
import { ElectronService } from './core/services';
import { TranslateService } from '@ngx-translate/core';
import { APP_CONFIG } from '../environments/environment';
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

@Component({
  selector: 'app-root',
  template: `<div *ngIf="valorDelSensor1 !== undefined">Valor del sensor Watterflow: {{ valorDelSensor1 }}</div>
            <div *ngIf="valorDelSensor2 !== undefined">Valor del sensor Volumen: {{ valorDelSensor2 }}</div>`,
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit{
  valorDelSensor1: number | undefined; 
  valorDelSensor2: number | undefined; 
  private sensorSubscription: Subscription | undefined;

  constructor(private arduinoService : ArduinoService, private cdr: ChangeDetectorRef) {}
  ngOnInit() {
    this.arduinoService.getSensorObservable(Sensor.WATER_FLOW).subscribe((valorDelSensor) => {
      console.log('Nuevo valor del sensor watterflow:', valorDelSensor);
      this.valorDelSensor1 = valorDelSensor;
      this.cdr.detectChanges();
      
      // Actualizar la interfaz de usuario u realizar acciones adicionales aquí
    });

    this.arduinoService.getSensorObservable(Sensor.VOLUME).subscribe((valorDelSensor) => {
      console.log('Nuevo valor del sensor Volumen:', valorDelSensor);
      this.valorDelSensor2 = valorDelSensor;
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
