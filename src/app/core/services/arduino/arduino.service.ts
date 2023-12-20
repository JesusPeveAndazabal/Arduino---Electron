// arduino.service.ts
import { Injectable } from '@angular/core';
import { SerialPort} from 'serialport'; 
import { ReadlineParser } from '@serialport/parser-readline'
import { ElectronService } from '../electron/electron.service';
import { ArduinoDevice } from './arduino.device';

@Injectable({
  providedIn: 'root',
})
export class ArduinoService {
  arduino1! : ArduinoDevice;
  /* arduino2! : ArduinoDevice; */

  constructor( private electronService: ElectronService,) {
    //this.arduino1 = new ArduinoDevice("COM23",115200,true,electronService);
   /*  this.arduino2 = new ArduinoDevice("COM4",9600,true,electronService); */
  }
}
