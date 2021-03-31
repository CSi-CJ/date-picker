import {DateAdapter} from '@angular/material/core';

export abstract class AbstructDateAdapter<D> extends DateAdapter<D> {
    abstract getHour(date: D): number;

    abstract getMinute(date: D): number;

    abstract getSecond(date: D): number;

    abstract setHour(date: D, value: number): D;

    abstract setMinute(date: D, value: number): D;

    abstract setSecond(date: D, value: number): D;


    isSameTime(a: D, b: D): boolean {
        if (a == null || b == null) {
            return true;
        }
        return this.getHour(a) === this.getHour(b)
            && this.getMinute(a) === this.getMinute(b)
            && this.getSecond(a) === this.getSecond(b);
    }

    copyTime(toDate: D, fromDate: D): D {
        const hour = this.setHour(toDate, this.getHour(fromDate));
        const minute = this.setMinute(hour, this.getMinute(fromDate));
        const second = this.setSecond(minute, this.getSecond(fromDate));
        return second;
    }

    compareDateWithTime(first: D, second: D, showSeconds?: boolean): number {
        let res = super.compareDate(first, second) ||
            this.getHour(first) - this.getHour(second) ||
            this.getMinute(first) - this.getMinute(second);
        if (showSeconds) {
            res = res || this.getSecond(first) - this.getSecond(second);
        }
        return res;
    }

    setTimeByDefaultValues(date: D, defaultTime: number[]): D {
        if (!Array.isArray(defaultTime)) {
            throw Error('@Input DefaultTime should be an array');
        }
        const hour = this.setHour(date, defaultTime[0] || 0);
        const minute = this.setMinute(hour, defaultTime[1] || 0);
        const second = this.setSecond(minute, defaultTime[2] || 0);
        return second;
    }

}
