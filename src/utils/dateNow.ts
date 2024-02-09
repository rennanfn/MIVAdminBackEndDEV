/* eslint-disable prettier/prettier */
import moment from 'moment';

export interface DateNowInterface {
  date: string; // 01
  month: string; // 12
  year: string; // 2021
}

export function dateNow(): DateNowInterface {
  const dateObj = new Date();
  // adjust 0 before single digit date
  const date = `0${dateObj.getDate()}`.slice(-2);
  // current month
  const month = `0${dateObj.getMonth() + 1}`.slice(-2);
  // current year
  const year = String(dateObj.getFullYear());

  const data: DateNowInterface = {
    date,
    month,
    year,
  };
  return data;
}

/**
 * Converte a data no formato Date para DD/MM/YYYY
 */
export function convertDate2String(date: Date | undefined): string {
  if (typeof date === 'undefined' || date === null) return '';
  // o método getMonth inicia no 0, por isso acicionamos 1 ao mesmo.
  // o moment.js converte a data para o fuso UTC e assim corrige a diferença de fuso, caso exista
  const momentDate = moment(date).utcOffset(0);
  const mes = String(momentDate.month() + 1).padStart(2, '0');
  const dia = String(momentDate.date()).padStart(2, '0');
  return `${dia}/${mes}/${momentDate.year()}`;
}

export function convertDate2StringMonth(date: Date | undefined): string {
  if (typeof date === 'undefined' || date === null) return '';
  // o método getMonth inicia no 0, por isso acicionamos 1 ao mesmo.
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  // const dia = String(date.getDate()).padStart(2, "0");
  return `${mes}/${date.getFullYear()}`;
}

/**
 * Converte a data no formato Date para YYYY-MM-DD HH:MM:SS
 */
export function convertDateTime2String(date: Date) {
  // o método getMonth inicia no 0, por isso acicionamos 1 ao mesmo.
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  const hora = String(date.getHours()).padStart(2,'0');
  const minuto = String(date.getMinutes()).padStart(2,'0');
  const segundo = String(date.getSeconds()).padStart(2,'0');
  return `${dia}/${mes}/${date.getFullYear()} ${hora}:${minuto}:${segundo}`;
}

/**
 * Recebe a data como string no formato YYYY-MM-DD e retorna como um Date do JS.
 */
export function convertString2Date(date:string): Date {
  const dateSplited = date.split('-');
  const year = dateSplited[0];
  const month = dateSplited[1];
  const day = dateSplited[2];
  const newDate = new Date(`${month}/${day}/${year}`);
  return newDate;
}
