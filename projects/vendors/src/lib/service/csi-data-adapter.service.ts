import {Inject, Injectable, InjectionToken, Optional} from '@angular/core';
import {AbstructDateAdapter} from './AbstructDateAdapter';
import {MAT_DATE_LOCALE} from '@angular/material/core';
import dayjs, {Dayjs} from 'dayjs';
import utc from 'dayjs/plugin/utc';
import localeData from 'dayjs/plugin/localeData';
import updateLocale from 'dayjs/plugin/updateLocale';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import preParsePostFormat from 'dayjs/plugin/preParsePostFormat';
export interface CsiDateAdapterOptions {
  /**
   * Turns the use of utc dates on or off.
   * Changing this will change how Angular Material components like DatePicker output dates.
   * {@default false}
   */
  useUtc?: boolean;
}

/** InjectionToken for Dayjs date adapter to configure options. */
export const MAT_CSI_DATE_ADAPTER_OPTIONS = new InjectionToken<CsiDateAdapterOptions>(
  'MAT_CSI_DATE_ADAPTER_OPTIONS', {
    providedIn: 'root',
    factory: MAT_CSI_DATE_ADAPTER_OPTIONS_FACTORY
  });

export function MAT_CSI_DATE_ADAPTER_OPTIONS_FACTORY(): CsiDateAdapterOptions {
  return {
    useUtc: false
  };
}

/** Creates an array and fills it with values. */
function range<T>(length: number, valueFunction: (index: number) => T): T[] {
  const valuesArray = Array(length);
  for (let i = 0; i < length; i++) {
    valuesArray[i] = valueFunction(i);
  }
  return valuesArray;
}

/** Adapts Dayjs Dates for use with Angular Material. */
@Injectable({
  providedIn: 'root',
})
export class CsiDateAdapter extends AbstructDateAdapter<number> {
  public csiFormats: CsiDateFormatsModel;
  private hour = 0;
  private minute = 0;
  private localeData: {
    firstDayOfWeek: number,
    longMonths: string[],
    shortMonths: string[],
    dates: string[],
    longDaysOfWeek: string[],
    shortDaysOfWeek: string[],
    narrowDaysOfWeek: string[],
  };

  constructor(
    private dateTimeService: CsiDatetimeService,
    @Optional() @Inject(MAT_DATE_LOCALE) public dateLocale: string,
    @Optional() @Inject(MAT_CSI_DATE_ADAPTER_OPTIONS) private options?: CsiDateAdapterOptions
  ) {
    super();
    const language = this.dateTimeService.getLanguage();
    dayjs.locale(language.toLowerCase());
    this.csiFormats = this.dateTimeService.getDateFormat(dayjs.locale());
    this.initializeParser(dateLocale || dayjs.locale());
  }

  private get shouldUseUtc(): boolean {
    const {useUtc}: CsiDateAdapterOptions = this.options || {};
    return !!useUtc;
  }

  // TODO: Implement
  setLocale(locale: string) {
    super.setLocale(locale);
    this.dateTimeService.updateMeridiem(locale);
    const dayJsLocaleData = dayjs().localeData();
    this.localeData = {
      firstDayOfWeek: dayJsLocaleData.firstDayOfWeek(),
      longMonths: dayJsLocaleData.months(),
      shortMonths: dayJsLocaleData.monthsShort(),
      dates: range(31, (i) => dayjs(this.createDate(2017, 0, i + 1)).format('D')),
      longDaysOfWeek: range(7, (i) => this.dayJs().set('day', i).format('dddd')),
      shortDaysOfWeek: dayJsLocaleData.weekdaysShort(),
      narrowDaysOfWeek: dayJsLocaleData.weekdaysMin(),
    };
    if (locale === 'ar'){
      this.localeData.firstDayOfWeek = 0;
    }
  }

  getYear(date: number): number {
    return this.dayJs(date).year();
  }

  getMonth(date: number): number {
    return this.dayJs(date).month();
  }

  getDate(date: number): number {
    return this.dayJs(date).date();
  }

  getDayOfWeek(date: number): number {
    return this.dayJs(date).day();
  }

  getHour(date: number): number {
    return dayjs(date).hour();
  }

  getMinute(date: number): number {
    return dayjs(date).minute();
  }

  getSecond(date: number): number {
    return dayjs(date).second();
  }

  setHour(date: number, value: number): number {
    return dayjs(date).hour(value).valueOf();
  }

  setMinute(date: number, value: number): number {
    return dayjs(date).minute(value).valueOf();
  }

  setSecond(date: number, value: number): number {
    return dayjs(date).second(value).valueOf();
  }

  getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
    return style === 'long' ? this.localeData.longMonths : this.localeData.shortMonths;
  }

  getDateNames(): string[] {
    return this.localeData.dates;
  }

  getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
    if (style === 'long') {
      return this.localeData.longDaysOfWeek;
    }
    if (style === 'short') {
      return this.localeData.shortDaysOfWeek;
    }
    // return this.localeData.narrowDaysOfWeek;
    return this.localeData.shortDaysOfWeek;
  }

  getYearName(date: number): string {
    return this.dayJs(date).format('YYYY');
  }

  getFirstDayOfWeek(): number {
    return this.localeData.firstDayOfWeek;
  }

  getNumDaysInMonth(date: number): number {
    return this.dayJs(date).daysInMonth();
  }

  clone(date: number): number {
    const dateClone = date;
    return dateClone;
  }

  createDate(year: number, month: number, date: number): number {
    if (month < 0 || month > 11) {
      throw Error(`Invalid month index "${month}". Month index has to be between 0 and 11.`);
    }
    if (date < 1) {
      throw Error(`Invalid date "${date}". Date has to be greater than 0.`);
    }
    const returnDayjs = this.dayJs().set('year', year).set('month', month).set('date', date);
    return returnDayjs.valueOf();
  }

  today(): number {
    return this.dayJs().valueOf();
  }

  parse(value: any, parseFormat: string): number | null {
    // valid date picker
    if (typeof value === 'string' && (parseFormat.indexOf(':') <= -1)) {
      const parseFormatDelimiter = parseFormat.toString().replace(/[A-Za-z]/g, '');
      const parseFormatStrings = parseFormat.split(parseFormatDelimiter.substring(0, 1));
      let valueDelimiter: string;
      let mFlag = false;
      let dFlag = false;
      let yFlag = false;
      let parseValueValid: number;
      if (typeof value === 'string') {
        valueDelimiter = value.toString().replace(/[0-9]/g, '');
        const valueStrings = value.split(valueDelimiter.substring(0, 1));
        parseFormatStrings.forEach((str: string) => {
          if (str.includes('m') || str.includes('M')) {
            const mNum = parseFormatStrings.indexOf(str);
            if (Number(valueStrings[mNum]) > 0 && Number(valueStrings[mNum]) <= 12) {
              mFlag = true;
            }
          } else if (str.includes('D') || str.includes('d')) {
            const dNum = parseFormatStrings.indexOf(str);
            if (Number(valueStrings[dNum]) > 0 && Number(valueStrings[dNum]) <= 31) {
              dFlag = true;
            }
          } else if (str.includes('Y') || str.includes('y')) {
            const yNum = parseFormatStrings.indexOf(str);
            if (str.length === 2) {
              if (Number(valueStrings[yNum]) > 0 && Number(valueStrings[yNum]) <= 99) {
                yFlag = true;
              }
            } else {
              if (Number(valueStrings[yNum]) > 0 && Number(valueStrings[yNum]) <= 9999) {
                yFlag = true;
              }
            }
          }
        });
        if (!(mFlag && dFlag && yFlag)){
          return null;
        }
        if (dayjs(value, parseFormat).format(parseFormat) === value) {
          parseValueValid = dayjs(value, parseFormat).valueOf();
        } else {
          return null;
        }
      }
      if (!(!!parseValueValid && parseValueValid > 0) || valueDelimiter !== parseFormatDelimiter) {
        return null;
      }
    }
    // valid time picker
    if (typeof value === 'string' && !this.shouldUseUtc && parseFormat.indexOf(':') > -1){
      const parseFormatDelimiter = parseFormat.toString().replace(/[A-Za-z0-9]/g, '');
      const valueDelimiter = value.toString().replace(/[A-Za-z0-9]/g, '');
      if (parseFormatDelimiter !== valueDelimiter){
        return null;
      }
      const charRegExp = new RegExp(/[`~!@#$%^&*()_\-+=<>?:"{}|,.\/;'\\ [\]·~！@#￥%……&*（）——\-+={}|《》？：“”【】、；‘'，。、]/im); // NOSONAR
      const parseFormatStrings = parseFormat.split(charRegExp);
      const valueStrings = value.split(charRegExp);
      let mFlag = false;
      let hFlag = false;
      let merdiemFlag = false;
      parseFormatStrings.forEach((str) => {
        if (str.includes('m') || str.includes('M')){
          const mNum = parseFormatStrings.indexOf(str);
          if (Number(valueStrings[mNum]) >= 0 && Number(valueStrings[mNum]) <= 59 && valueStrings[mNum].length === str.length) {
            this.minute = Number(valueStrings[mNum]);
            mFlag = true;
          }
        }else if (str.includes('h') || str.includes('H')){
          const hNum = parseFormatStrings.indexOf(str);
          if ((parseFormatStrings.indexOf('a') > -1 && Number(valueStrings[hNum]) >= 0 && Number(valueStrings[hNum]) <= 12) ||
            ((parseFormatStrings.indexOf('a') <= -1) && Number(valueStrings[hNum]) >= 0 && Number(valueStrings[hNum]) <= 23)) {
            if (Number(valueStrings[hNum]) >= 0 && Number(valueStrings[hNum]) < 10 && str.length === 2){
              if (valueStrings[hNum].length !== 2){
                return null;
              }
            }
            this.hour = Number(valueStrings[hNum]);
            hFlag = true;
          }
        } else if (str.includes('a') || str.includes('A')) {
          const merdiemNum = parseFormatStrings.indexOf(str);
          if (valueStrings[merdiemNum] === 'AM' || valueStrings[merdiemNum] === 'PM'){
            merdiemFlag = true;
          }
        }
      });
      if ((parseFormatStrings.indexOf('a') > -1 && !(mFlag && hFlag && merdiemFlag))
        || (parseFormatStrings.indexOf('a') <= -1 && !(mFlag && hFlag))){
        return null;
      }
    }
    if (value && typeof value === 'string') {
      const parseValue = this.dayJs(value, parseFormat, this.locale);
      if (parseValue.hour() === 0 && parseValue.minute() === 0 && this.shouldUseUtc) {
        return this.dayJs(value, parseFormat, this.locale).add(1, 'day').valueOf();
      }
      return this.dayJs(value, parseFormat, this.locale).valueOf();
    }
    return value ? this.dayJs(value).locale(this.locale).valueOf() : null;
  }

  format(date: number, displayFormat: string): string {
    if (!this.isValid(date)) {
      throw Error('CsiDateAdapter: Cannot format invalid date.');
    }
    return dayjs(date).locale(this.locale).format(displayFormat);
  }

  addCalendarYears(date: number, years: number): number {
    return dayjs(date).add(years, 'year').valueOf();
  }

  addCalendarMonths(date: number, months: number): number {
    return dayjs(date).add(months, 'month').valueOf();
  }

  addCalendarDays(date: number, days: number): number {
    return dayjs(date).add(days, 'day').valueOf();
  }

  toIso8601(date: number): string {
    return dayjs(date).toISOString();
  }

  /**
   * Attempts to deserialize a value to a valid date object. This is different from parsing in that
   * deserialize should only accept non-ambiguous, locale-independent formats (e.g. a ISO 8601
   * string). The default implementation does not allow any deserialization, it simply checks that
   * the given value is already a valid date object or null. The `<mat-datepicker>` will call this
   * method on all of it's `@Input()` properties that accept dates. It is therefore possible to
   * support passing values from your backend directly to these properties by overriding this method
   * to also deserialize the format used by your backend.
   * @param value The value to be deserialized into a date object.
   * @returns The deserialized date object, either a valid date, null if the value can be
   *     deserialized into a null date (e.g. the empty string), or an invalid date.
   */
  deserialize(value: any): number | null {
    if (this.validTime(value)) {
      this.hour = dayjs(value).hour();
      this.minute = dayjs(value).minute();
    }
    let date;
    if (value instanceof Date) {
      date = this.dayJs(value);
    } else if (this.isDateInstance(value)) {
      // NOTE: assumes that cloning also sets the correct locale.
      return this.clone(value);
    }
    if (typeof value === 'string') {
      if (!value) {
        return null;
      }
      date = this.dayJs(value).toISOString();
    }
    if (date && this.isValid(date)) {
      return this.dayJs(date).valueOf(); // NOTE: Is this necessary since Dayjs is immutable and Moment was not?
    }
    return super.deserialize(value);
  }

  isDateInstance(obj: any): boolean {
    return typeof obj === 'number';
  }

  isValid(date: number): boolean {
    return dayjs(date).isValid();
  }

  invalid(): number {
    return dayjs().valueOf();
  }

  public dayJs(input?: any, format?: string, locale?: string): Dayjs {
    if (!this.shouldUseUtc) {
      // When enabled meridian if manually change 12:00 AM to 12:00 A
      // it will be changed to 12:00 PM, but shouldn't be modified
      // Same as PM
      let _hour = this.hour;
      if (typeof input === 'string' && (input.includes('A') || input.includes('a'))) {
        _hour = this.hour % 12;
      } else if (typeof input === 'string' && (input.includes('P') || input.includes('p'))) {
        _hour = this.hour + 12;
      }
      if (this.hour || this.minute) {
        return dayjs(input, format, locale).hour(_hour).minute(this.minute).second(0).millisecond(0);
      } else {
        return dayjs(input, format, locale).hour(0).minute(0).second(0).millisecond(0);
      }
    }
    if (this.hour !== 0 || this.minute !== 0) {
      return dayjs(input, format, locale).hour(this.hour).minute(this.minute).second(0).millisecond(0);
    }
    return dayjs(input, format, locale).utc().hour(0).minute(0).second(0).millisecond(0);
  }

  private compareTime(value: any = 0): number {
    const hour = dayjs(value).hour();
    const minute = dayjs(value).minute();
    return dayjs(0).hour(hour).minute(minute).second(0).millisecond(0).valueOf();
  }

  private validTime(value: any) {
    return (dayjs(value).hour() || dayjs(value).minute()) && this.compareTime(value) !== this.compareTime();
  }

  private initializeParser(dateLocale: string) {
    if (this.shouldUseUtc) {
      dayjs.extend(utc);
    }

    dayjs.extend(LocalizedFormat);
    dayjs.extend(customParseFormat);
    dayjs.extend(localeData);
    dayjs.extend(updateLocale);
    dayjs.extend(preParsePostFormat);

    this.setLocale(dateLocale);
  }
}
