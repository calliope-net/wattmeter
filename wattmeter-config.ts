
namespace wattmeter

{
    //% group="i2c Configuration Register" advanced=true
    //% block="i2c %pADDR Konfiguration %mode"
    //% mode.defl=wattmeter.eInaMode.shunt_and_bus_vol_con
    export function config(pADDR: eADDR, mode: eInaMode) { // Set operation Mode
        let conf = 0
        conf = read_ina_reg(pADDR, eRegister.REG_CONFIG)
        conf &= ~0x07       // FEDCBA9876543210 // Bit 2^2 MODE3 - 2^0 MODE1
        conf |= mode        //              111 // Shunt and bus, continuous
        write_register(pADDR, eRegister.REG_CONFIG, conf)
    }
}