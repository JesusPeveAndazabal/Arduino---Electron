export class BaseRegistroPeso{
    public id : number;
    public codigo_sap : string;
    public peso : number;
    public estado : number;
    public tarifa : number;
    public balanza_id : number;
    public ceco_id : number;
    public presentacion_ceco_id : number;
    public programacion_id : number;
    public personal : string;
    public hora : string;
    public frapido : boolean;
    public mrapido : boolean;
    public cexacto : boolean;
    public uid_peso : string;
    public tipo_pesaje : number;
}

export class RegistroPeso extends BaseRegistroPeso{
    
    public turno_id : number;

    public constructor(codigo_sap : string, peso : number, estado : number, tarifa : number, balanza_id : number,ceco_id : number,presentacion_ceco_id : number,programacion_id : number,personal : string,hora : string,
        frapido : boolean,mrapido : boolean,cexacto : boolean,uid_peso : string,tipo_pesaje : number,turno_id : number) {
        super();
        this.codigo_sap = codigo_sap;
        this.peso = peso;
        this.estado = estado;
        this.tarifa = tarifa;
        this.balanza_id = balanza_id;
        this.ceco_id = ceco_id;
        this.presentacion_ceco_id = presentacion_ceco_id;
        this.programacion_id = programacion_id;
        this.personal = personal;
        this.hora = hora;
        this.frapido = frapido;
        this.mrapido = mrapido;
        this.cexacto = cexacto;
        this.uid_peso = uid_peso;
        this.tipo_pesaje = tipo_pesaje;
        this.turno_id = turno_id;
    } 
}