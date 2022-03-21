const redis = require("redis");
const util = require('util');
const htmlspecialchars = require('htmlspecialchars');
const urlencode = require('rawurlencode');

const client = redis.createClient();
client.get = util.promisify(client.get);
client.lrange = util.promisify(client.lrange);
client.on("error", function(error) {
    console.error(error);
});
const PATTERNS_KEY = 'PATTERNS';

let patternsOld = [
    "One\-Time\-Password \(OTP\): $number",
    "(https?://api.clim8invest.com/mobile-app/no-auth/api/v1/login/[^\s'\"]+)",
    "confirmation code is: $number",
    '<div style="[^"]+">$number',
    "Verification code: $number",
    "one-time verification code you requested: $number",
    // "Z%-!.*?\(B\]$number",
    "your confirmation code. $number",
    '(https?://accounts.[\w]+.gigya.com[^\s"\']+)',
    "use your pin here $number",
    "Verify \([^\(]+\) $number",
    // "#mytaylormadeplus\) $number",
    "Magic Pin mobile application. $number",
    "(https?://xy59r.app.goo.gl/[^\"'\s]+)",
    // "#أكمل عملية توثيق الحساب \[$link\]",
    '\\[([^\\]]+activation_token=[^\\]]+)\\]',
    "<a[^>]*href=\"(https?://[^\s]+activation_token=[^\s]+)\"[^>]*>Activate Your Account",
    "Verifikasi Email: {$number}", // indo
    // "#กรุณานำรหัสดังกล่าวไปใช้ในหน้ายืนยันอีเมล {$number}", // thailan
    "Pengesahan Emel: {$number}", // malay
    "Your security verification code : {$number}",
    "Your code is: {$number}",
    "Verification Page: {$number}", // fallback to english
    "รหัสเปิดใช้งาน: {$number} ",
    "verification code is {$number}",
    "<td class=[^>]*>{$number}</td>",
    "favourite menu items and earning Rewards! {$number}",
    "bevestigen. DE CODE {$number}",
    "Sie den folgenden Code ein : {$number}",
    "verification code {$number}",
    "nhập mã xác nhận này : {$number}",
    '(https?://[^/]*/api/[^/]*/confirm_email/\\w+)',
    "{$number} is you Koo OTP",
    "{$number} Kode di atas hanya berlaku",
    "{$number} </b>&nbsp; is your One Time Password",
    '(https?://nailiegate.page.link/[\\w\\-_]+)',
    // "#タップして認証 \\[?{$link}\\]?",
    // "#Confirm \[(https?://[^\[\]]+)\].",
    "%-!\\<.*\\(B\\]{$number}",
    // "#Bekræft e-mail \\[{$link}\\]",
    '<a href="(http[^"]+)">Confirmer mon adresse',
    "<a href='(https?[^\\s]+link=https?://prod-bunch[^\\s]+)'>",
    "(https?://[^\\s\"'>\\]]+(?:verif|activa|confirm)[^'\"\\s><\\[\\]]+)",
    "Valider mon adresse email \\[{$link}\\]",
    "Confirm Email \\( {$link} \\)",
    '<a href="(http[^"])">Confirmer mon adresse e-mail',
    "verifica tu correo electrónico con el siguiente código: {$number}",
    "{$number} Here is your OTP verification code",
    "complete your Olympic ID registration. {$number}",
    "Klik dan op onderstaande link. {$link}",
    "ACTIVER MON COMPTE {$link}",
    "Valider mon adresse email \\[{$link}\\]",
    "to verify your email address {$link}",
    "Validate my email address \\[{$link}\\]",
    "<a href=\"{$link}\"[^>]*>CONFIRM</a>",
    "Your Sign-In OTP is {$number}.",
    "認証コード: {$number}",
    "{$number} Confirm my account",
    "Customer authorization code \\[ {$number} \\]",
    // twitter
    "enter your Twitter password : {$alphaNumber}",
    // amazon
    "following code :? {$number}",
    "following One Time Password (?:\\(OTP\\))? : {$number}",
    "click this link:</p> <p><a href='{$link}'>Sign in to VibePay",
    // amazonjp
    "以下のコードを入力してください : {$number}",
    '([\\d]{5,}) Enter the code',
    '([\\d]{5,}) Pour vous',
    // facebook
    "this confirmation code : {$number}",
    // trip
    "帳戶註冊驗證碼︰ {$number}",
    // shoppe
    'No , verify my email only . \\[(https?://.*?)\\]',
    // fiverr
    'Activate Your Account \\[(.*?)\\]',
    // appne11
    "Please click here {$linkMarkdown} ",
    "Enter the verification code, or click the link below. {$number}",
    "お客様の認証コード \\[ {$number} \\]",
    "Verify Email \\[{$link}\\]",
    "VERIFY MY EMAIL \\( {$link} \\)",
    "noch auf diesen Link klicken: {$link}",
    "One Time Password (?:\\(OTP\\):?)? {$number}",
    "registration by clicking below. {$link}",
    // "#One\s*-?\s*Time Password .*? :? $number",
    "<a[^>]*href=\"{$link}\"[^>]*>Confirm Email",
    "following single-use code . {$alphaNumber}",
    "Retorne à página e digite o código : {$number}",
    "\\\$B3NG'%3!<%I[^\\(]*\\(B {$number}",
    "Complete your registration by clicking below. {$link}",
    '\\[(https?://www.amazon[^/]+/gp/f.html[^\\]]+)\\]',
    '\\[(https?://[^/]*mynunc\\.com/member/join/create-member-form.*?)\\]',
    '\\[{$link}]',
    // magisto
    "confirm your email. ({$link})",
    "Confirm Your Email ({$link})",
    // irlapp.com.IRL
    "Here is your IRL Auth Code: {$number}",
    "click on the following URL : {$link}",
    "Confirm Your Email {$linkMarkdown}",
    "Please verify your account by using below OTP. {$number}",
    // generic
    // "#\s+([\d]{5,})\s+",
    // "#[^\d]([\d]{5,})[^\d]",
    "verification :? {$number}",
    "verification code :? {$alphaNumber}"
];

const number = '([\\d]{3,})(?=[^d])';
const alphaNumber = '([\\w]{3,})';
const link = '(https?://[^\\s]+)';
const linkMarkdown = '<(http[^>]+)>';

let patterns = []
for (const value of patternsOld){
    let s_pattern = value.replace('{$linkMarkdown}', linkMarkdown).replace('{$link}', link)
          .replace('{$alphaNumber}', alphaNumber).replace('{$number}', number).replace(/#/g,'');
    patterns.push(s_pattern)
}

async function findVerificationText(input)
{
    for (var pattern of patterns) {
        let m;
        let regex = RegExp(pattern, 'g');
        let array1;
        while ((array1 = regex.exec(input)) !== null) {
          console.log(`Found ${array1[1]}. Next starts at ${regex.lastIndex}.`);

          let result = array1[1].trim();
          if (result.includes('://')) {
              // result = htmlspecialchars_decode(result);
              result = htmlspecialchars(result);
              result = result.replace("\n", urlencode(' '));
          }
          return result;
        }
    }
    return null;
}


const s_input = '[https://api.dp01a.aia.com/backend/redirect?url=crimson://page/setpassword/token=xz8sESNFfhUijIwEnAv2]';



async function main(){
    const code = await findVerificationText(s_input)
    // const test = await client.get('foo');
    console.log('code:' + code)
}

main()
