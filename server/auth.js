import crypto from 'node:crypto'

export const hashPw = (pw) => {
  const salt = crypto.randomBytes(16)
  return `scrypt$${salt.toString('hex')}$${crypto.scryptSync(pw, salt, 64).toString('hex')}`
}

export const checkPw = (pw, stored) => {
  const [, saltHex, hashHex] = stored.split('$')
  const h = crypto.scryptSync(pw, Buffer.from(saltHex, 'hex'), 64)
  return crypto.timingSafeEqual(h, Buffer.from(hashHex, 'hex'))
}

// Chính sách mật khẩu: 10–128 ký tự, có chữ thường, chữ hoa và chữ số
export function passwordProblem(pw) {
  if (typeof pw !== 'string') return 'Mật khẩu không hợp lệ'
  if (pw.length < 10) return 'Mật khẩu phải có ít nhất 10 ký tự'
  if (pw.length > 128) return 'Mật khẩu tối đa 128 ký tự'
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/\d/.test(pw)) return 'Mật khẩu cần có chữ thường, chữ hoa và chữ số'
  return null
}

const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function randomPassword(len = 14) {
  for (;;) {
    let p = ''
    for (let i = 0; i < len; i++) p += ALPHABET[crypto.randomInt(ALPHABET.length)]
    if (!passwordProblem(p)) return p
  }
}
