export class Presentacion {
    public id : number;
    public centro_costo : number;
    public name : string;
    public min : number;
    public max : number;
    public price : number;
    public pallet_qty : number; 
    public ticket : string;
    public active : boolean;
    public class : string;
    public classBadge : string;
    public resume : number;

    constructor(){
        this.name = "-";
        this.id = 0;
    }
}