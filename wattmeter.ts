
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
    //% block="i2c %pADDR scan"
    export function scan(pADDR: eADDR): boolean {
        let bu = Buffer.create(1)
        bu.setUint8(0, 0)
        //bu.setNumber(NumberFormat.UInt16BE, 1, value)
        return pins.i2cWriteBuffer(pADDR, bu, false) == 0
    }

    //% group="i2c init"
    //% block="i2c %pADDR begin"
    export function begin(pADDR: eADDR) { // Initialize I2C bus and configure INA219 config register before reading data
        if (!scan(pADDR)) {
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

    // ========== group="i2c Configuration Register"

    export enum eIna219BusVolRange {    // Bus Voltage Range
        bus_vol_range_16V = 0,  // Voltage range ±16V
        bus_vol_range_32V = 1   // Voltage range ±32V
        /*
        const bus_vol_range_16V = 0 // Voltage range ±16V
        const bus_vol_range_32V = 1 // Voltage range ±32V
        */
    }
    //% group="i2c Configuration Register" advanced=true
    //% block="i2c %pADDR set bus RNG %value" weight=5
    //% value.defl=wattmeter.eIna219BusVolRange.bus_vol_range_32V
    export function set_bus_RNG(pADDR: eADDR, value: eIna219BusVolRange) { // Set BRNG (Bus Voltage Range)
        let conf = 0
        conf = read_ina_reg(pADDR, eRegister.REG_CONFIG)
        conf &= ~(0x01 << 13)   // FEDCBA9876543210 // Bit 2^13 BRNG
        conf |= value << 13     //   1
        write_register(pADDR, eRegister.REG_CONFIG, conf)
    }




    export enum eIna219PGABits {    // GAIN and range for PGA(Shunt Voltage Only)
        PGA_bits_1 = 0, // GAIN:1,Range ±40 mV
        PGA_bits_2 = 1, // GAIN:/2,Range ±80 mV
        PGA_bits_4 = 2, // GAIN:/4,Range ±160 mV
        PGA_bits_8 = 3  // GAIN:/8,Range ±320 mV
        /*
        //GAIN and range for PGA(Shunt Voltage Only)
        const PGA_bits_1 = 0 // GAIN:1,Range ±40 mV
        const PGA_bits_2 = 1 // GAIN:/2,Range ±80 mV
        const PGA_bits_4 = 2 // GAIN:/4,Range ±160 mV
        const PGA_bits_8 = 3 // GAIN:/8,Range ±320 mV     default value 11 ±320 mV
        */
    }
    //% group="i2c Configuration Register" advanced=true
    //% block="i2c %pADDR set PGA %bits" weight=4
    //% bits.defl=wattmeter.eIna219PGABits.PGA_bits_8
    export function set_PGA(pADDR: eADDR, bits: eIna219PGABits) { // Set PGA parameter (Shunt Voltage Only)
        let conf = 0
        conf = read_ina_reg(pADDR, eRegister.REG_CONFIG)
        conf &= ~(0x03 << 11)   // FEDCBA9876543210 // Bit 2^12 PG1, 2^11 PG0
        conf |= bits << 11      //    11            // GAIN:/8,Range ±320 mV
        write_register(pADDR, eRegister.REG_CONFIG, conf)
    }





    export enum eIna219AdcBits {
        /*
        These bits adjust the Shunt ADC resolution (9-, 10-, 11-, or 12-bit) 
        or set the number of samples used when averaging results for the Shunt Voltage Register (01h).
        */
        adc_bits_9 = 0, // Resolution is 9bit
        adc_bits_10 = 1, // Resolution is 10bit
        adc_bits_11 = 2, // Resolution is 11bit
        adc_bits_12 = 3 // Resolution is 12bit
        /* 
        const adc_bits_9 = 0 // Resolution is 9bit
        const adc_bits_10 = 1 // Resolution is 10bit
        const adc_bits_11 = 2 // Resolution is 11bit
        const adc_bits_12 = 3 // Resolution is 12bit
        */
    }
    export enum eIna219AdcSample {  // Size of the sample collected by adc every time
        adc_sample_1 = 0, adc_sample_2 = 1, adc_sample_4 = 2, adc_sample_8 = 3,
        adc_sample_16 = 4, adc_sample_32 = 5, adc_sample_64 = 6, adc_sample_128 = 7
        /*
        //Size of the sample collected by adc every time                          
        const adc_sample_1 = 0
        const adc_sample_2 = 1
        const adc_sample_4 = 2
        const adc_sample_8 = 3
        const adc_sample_16 = 4
        const adc_sample_32 = 5
        const adc_sample_64 = 6
        const adc_sample_128 = 7
        */
    }
    //% group="i2c Configuration Register" advanced=true
    //% block="i2c %pADDR set bus ADC %bits %sample" weight=3
    //% bits.defl=wattmeter.eIna219AdcBits.adc_bits_12
    export function set_bus_ADC(pADDR: eADDR, bits: eIna219AdcBits, sample: eIna219AdcSample) {
        let conf = 0
        let value = 0
        if (bits < eIna219AdcBits.adc_bits_12 && sample > eIna219AdcSample.adc_sample_1) {
            return
        }
        if (bits < eIna219AdcBits.adc_bits_12) {
            value = bits
        } else {
            value = 0x08 | sample
        }
        //lcd16x2rgb.writeText(lcd16x2rgb.eADDR_LCD.LCD_16x2, 1, 0, 4, lcd16x2rgb.eAlign.left, value.toString())
        conf = read_ina_reg(pADDR, eRegister.REG_CONFIG)
        conf &= ~(0x0f << 7)    // FEDCBA9876543210 // Bit 2^10 BADC4 - 2^7 BADC1
        conf |= value << 7      //      0011
        write_register(pADDR, eRegister.REG_CONFIG, conf)
    }

    //% group="i2c Configuration Register" advanced=true
    //% block="i2c %pADDR set shunt ADC %bits %sample" weight=2
    //% bits.defl=wattmeter.eIna219AdcBits.adc_bits_12
    export function set_shunt_ADC(pADDR: eADDR, bits: eIna219AdcBits, sample: eIna219AdcSample) {
        let conf = 0
        let value = 0
        if (bits < eIna219AdcBits.adc_bits_12 && sample > eIna219AdcSample.adc_sample_1) {
            return
        }
        if (bits < eIna219AdcBits.adc_bits_12) {
            value = bits
        } else {
            value = 0x08 | sample
        }
        //lcd16x2rgb.writeText(lcd16x2rgb.eADDR_LCD.LCD_16x2, 1, 5, 9, lcd16x2rgb.eAlign.left, value.toString())
        conf = read_ina_reg(pADDR, eRegister.REG_CONFIG)
        conf &= ~(0x0f << 3)    // FEDCBA9876543210 // Bit 2^6 SADC3 - 2^3 SADC1
        conf |= value << 3      //          0011
        write_register(pADDR, eRegister.REG_CONFIG, conf)
    }




    export enum eInaMode {      // Operating Mode
        power_down = 0,             // Power-down
        shunt_vol_trig = 1,         // Shunt voltage, triggered
        bus_vol_trig = 2,           // Bus voltage, triggered
        shunt_and_bus_vol_trig = 3, // Shunt and bus, triggered
        adc_off = 4,                // ADC off (disabled)
        shunt_vol_con = 5,          // Shunt voltage, continuous
        bus_vol_con = 6,            // Bus voltage, continuous
        shunt_and_bus_vol_con = 7   // Shunt and bus, continuous
        /*
        const power_down = 0 // Power-down
        const shunt_vol_trig = 1 // Shunt voltage, triggered
        const bus_vol_trig = 2 // Bus voltage, triggered
        const shunt_and_bus_vol_trig = 3 // Shunt and bus, triggered
        const adc_off = 4 // ADC off (disabled)
        const shunt_vol_con = 5 // Shunt voltage, continuous
        const bus_vol_con = 6 // Bus voltage, continuous
        const shunt_and_bus_vol_con = 7 // Shunt and bus, continuous
        */
    }
    //% group="i2c Configuration Register" advanced=true
    //% block="i2c %pADDR set mode %mode" weight=1
    //% mode.defl=wattmeter.eInaMode.shunt_and_bus_vol_con
    export function set_mode(pADDR: eADDR, mode: eInaMode) { // Set operation Mode
        let conf = 0
        conf = read_ina_reg(pADDR, eRegister.REG_CONFIG)
        conf &= ~0x07       // FEDCBA9876543210 // Bit 2^2 MODE3 - 2^0 MODE1
        conf |= mode        //              111 // Shunt and bus, continuous
        write_register(pADDR, eRegister.REG_CONFIG, conf)
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
