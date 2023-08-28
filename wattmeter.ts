
//% color=#002F5F icon="\uf243" block="Wattmeter" weight=01
namespace wattmeter
/* 230828
[Hardware] https://www.dfrobot.com/product-1827.html
[Datasheet] https://github.com/DFRobot/Wiki/raw/master/SEN0291/res/INA219.pdf
            Register ab Seite 18

https://www.digikey.de/de/products/detail/dfrobot/SEN0291/10279750
https://www.mouser.de/ProductDetail/426-SEN0291

https://media.digikey.com/pdf/Data%20Sheets/DFRobot%20PDFs/SEN0291_Web.pdf
https://wiki.dfrobot.com/Gravity:%20I2C%20Digital%20Wattmeter%20SKU:%20SEN0291

https://github.com/DFRobot/DFRobot_INA219
https://github.com/DFRobot/DFRobot_INA219/blob/master/Python/RespberryPi/DFRobot_INA219.py

Modul wurde geliefert mit eingestellter i2c-Adresse 0x45; DIP Schalter mit Schutzfolie zugeklebt

Code anhand der Python library und Datenblätter neu programmiert von Lutz Elßner im August 2023
*/ {
    export enum eADDR {
        Wattmeter_x45 = 0x45, Wattmeter = 0x40, Wattmeter_x41 = 0x41, Wattmeter_x44 = 0x44
    }

    export enum eRegister {
        REG_CONFIG = 0x00,          // Config register
        REG_SHUNTVOLTAGE = 0x01,    // Shunt Voltage Register
        REG_BUSVOLTAGE = 0x02,      // Bus Voltage Register
        REG_POWER = 0x03,           // Power Register
        REG_CURRENT = 0x04,         // Current Register
        REG_CALIBRATION = 0x05      // Register Calibration
    }
    const INA219_CONFIG_RESET = 0x8000 // Config reset register


    let cal_value: number // uint16_t
    let BusRange: number, Pga: number, Badc: number, Sadc: number, Mode: number // uint8_t

    // ========== group="i2c init"

    //% group="i2c init"
    //% block="i2c %pADDR is connected"
    export function is_connected(pADDR: eADDR): boolean {
        let bu = Buffer.create(1)
        bu.setUint8(0, 0)
        return pins.i2cWriteBuffer(pADDR, bu) == 0
    }

    //% group="i2c init"
    //% block="i2c %pADDR begin"
    export function begin(pADDR: eADDR) { // Initialize I2C bus and configure INA219 config register before reading data
        if (!is_connected(pADDR)) {
            return false
        } else {
            cal_value = 4096
            set_bus_RNG(pADDR, eIna219BusVolRange.bus_vol_range_32V)    // 1
            set_PGA(pADDR, eIna219PGABits.PGA_bits_8)                   // 3
            control.waitMicros(1000)
            set_bus_ADC(pADDR, eIna219AdcBits.adc_bits_12, eIna219AdcSample.adc_sample_8)   // 3 3
            control.waitMicros(1000)
            set_shunt_ADC(pADDR, eIna219AdcBits.adc_bits_12, eIna219AdcSample.adc_sample_8) // 3 3
            control.waitMicros(1000)
            set_mode(pADDR, eInaMode.shunt_and_bus_vol_con) // 7
            return true
        }
    }

    //% group="i2c init"
    //% block="i2c %pADDR linear_cal ina_mA %ina219_reading_mA ext_mA %ext_meter_reading_mA"
    export function linear_cal(pADDR: eADDR, ina219_reading_mA: number, ext_meter_reading_mA: number) { // Linear calibration
        /*
        @param ina219_reading_mA    The current measured by INA219 (before calibration)
        @param ext_meter_reading_mA  Actual measured current
        */
        //ina219_reading_mA = float(ina219_reading_mA)
        //ext_meter_reading_mA = float(ext_meter_reading_mA)
        cal_value = Math.trunc((ext_meter_reading_mA / ina219_reading_mA) * cal_value) & 0xFFFE
        write_register(pADDR, eRegister.REG_CALIBRATION, cal_value)
    }

    //% group="i2c init"
    //% block="i2c %pADDR reset"
    export function reset(pADDR: eADDR) {
        write_register(pADDR, eRegister.REG_CONFIG, INA219_CONFIG_RESET) // 0x8000
    }






    // ========== group="i2c Messwerte lesen"

    //% group="i2c Messwerte lesen"
    //% block="i2c %pADDR get shunt voltage mV"
    export function get_shunt_voltage_mV(pADDR: eADDR) { // get the ShuntVoltage （Voltage of the sampling resistor, IN+ to NI-)
        return read_ina_reg(pADDR, eRegister.REG_SHUNTVOLTAGE)  // py
        // return read_ina_reg(pADDR, eRegister.REG_SHUNTVOLTAGE) * 0.01  // cpp
    }

    //% group="i2c Messwerte lesen"
    //% block="i2c %pADDR get bus voltage V"
    export function get_bus_voltage_V(pADDR: eADDR) { // get the BusVoltage （Voltage of IN- to GND)
        return (read_ina_reg(pADDR, eRegister.REG_BUSVOLTAGE) >> 1) * 0.001             // py   0.001/2=0.0005
        //return (read_ina_reg_Unsigned(pADDR, eRegister.REG_BUSVOLTAGE) >> 3) * 0.004    // cpp  0.004/8=0.0005
    }

    //% group="i2c Messwerte lesen"
    //% block="i2c %pADDR get power mW"
    export function get_power_mW(pADDR: eADDR) { // get the Current(Current flows across IN+ and IN-)
        return read_ina_reg(pADDR, eRegister.REG_POWER) * 20
    }

    //% group="i2c Messwerte lesen"
    //% block="i2c %pADDR get current mA"
    export function get_current_mA(pADDR: eADDR) { // get the Current(Current flows across IN+ and IN-)
        return read_ina_reg(pADDR, eRegister.REG_CURRENT)
    }




    // ========== advanced=true

    // ========== group="i2c Adressen"

    //% group="i2c Adressen" advanced=true
    //% block="i2c Adresse von Modul %pADDR"
    export function i2cAdressen(pADDR: eADDR): number { return pADDR }


    // ========== group="i2c ina Register"

    //% group="i2c ina Register" advanced=true
    //% block="i2c %pADDR read ina reg %register (Int16BE)"
    export function read_ina_reg(pADDR: eADDR, register: eRegister): number { // return: int16_t
        return read_register(pADDR, register).getNumber(NumberFormat.Int16BE, 0)
    }

    //% group="i2c ina Register" advanced=true
    //% block="i2c %pADDR read ina reg Unsigned %register (UInt16BE)"
    export function read_ina_reg_Unsigned(pADDR: eADDR, register: eRegister): number { // return: uint16_t
        return read_register(pADDR, register).getNumber(NumberFormat.UInt16BE, 0)
    }


    // ========== group="i2c Register"

    //% group="i2c Register" advanced=true
    //% block="i2c %pADDR write_register %register %value (16 Bit)"
    export function write_register(pADDR: eADDR, register: eRegister, value: number) { // value: uint16_t
        let bu = Buffer.create(3)
        bu.setUint8(0, register)
        bu.setNumber(NumberFormat.UInt16BE, 1, value)
        pins.i2cWriteBuffer(pADDR, bu)
    }

    //% group="i2c Register" advanced=true
    //% block="i2c %pADDR read_register %register (Buffer)"
    export function read_register(pADDR: eADDR, register: eRegister): Buffer { // return: Buffer
        let bu = Buffer.create(1)
        bu.setUint8(0, register)
        //bu.setNumber(NumberFormat.UInt16BE, 1, value)
        pins.i2cWriteBuffer(pADDR, bu, true)

        return pins.i2cReadBuffer(pADDR, 2) //.getNumber(NumberFormat.UInt16BE, 0)
    }


} // wattmeter.ts
