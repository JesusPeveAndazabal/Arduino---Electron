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


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  private arduino1 : any;
  private arduino2 : any;
  private parser1 : any;
  private parser2 : any;
  private messages_from_device! : [{}];
  private messages_to_device! : [{}];
  private on_status_changed : any;
  private _device : any;
  private message! : [{}];
  private data : any;
  private manual_settings : Boolean = false;
  private mode = 0;
  private connected : boolean = false;
  private is_running : boolean = false;
  private sensors! : [];

 


  constructor(
    private arduinoService : ArduinoService,
    private translate: TranslateService,
  ) {
 /*    this.on_status_changed = callback
    this.name = name
    this.manual_setting = manual_setting

    if (manual_setting){
      this.sensors = sensors
      this.mode = mode1

    this.port = port
    this.baudrate = baudrate
    this._device = NONE_TYPE
    this.connect()
    }
 */
  }

  ngOnInit(){
   
  }
}
