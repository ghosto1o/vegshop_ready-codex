function toTLV(id, value){ const len = (''+value).length; return id + String(len).padStart(2,'0') + value }
function crc16ccitt(str){
  let crc = 0xFFFF
  for (let i=0;i<str.length;i++){
    crc ^= str.charCodeAt(i) << 8
    for (let j=0;j<8;j++){
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021
      else crc <<= 1
      crc &= 0xFFFF
    }
  }
  return crc.toString(16).toUpperCase().padStart(4,'0')
}
export function buildPromptPayQR({ mobile, amount, name='VEG SHOP', city='BANGKOK' }){
  const digits = (mobile||'').replace(/\D/g,'')
  const acct = toTLV('00','A000000677010111') + toTLV('01','0066'+digits.replace(/^0/,''))
  const guid = toTLV('29', acct)
  const payload = toTLV('00','01') + toTLV('01','11') + guid + toTLV('53','764') + (amount? toTLV('54', Number(amount).toFixed(2)) : '') + toTLV('58','TH') + toTLV('59', name.slice(0,25)) + toTLV('60', city.slice(0,15)) + '6304'
  const crc = crc16ccitt(payload)
  return payload + crc
}
