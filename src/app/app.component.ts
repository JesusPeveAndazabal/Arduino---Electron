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



@Component({
  selector: 'app-root',
  template: `
    <div>
      <h1>Datos en tiempo real:</h1>
      <p>{{ realTimeData }}</p>
    </div>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  realTimeData!: number;

  constructor(private realTimeDataService: RealTimeDataService) {}

  ngOnInit() {
    this.realTimeDataService.data$.subscribe((data:any) => {
      this.realTimeData = data;
    });

    // Simular cambios en tiempo real (esto es solo para demostración)
    setInterval(() => {
      const newValue = Math.floor(Math.random() * 100); // Valor aleatorio para simular cambios
      this.realTimeDataService.updateRealTimeData(newValue);
    }, 2000); // Cambia cada 2 segundos (simulación)
  }
}
