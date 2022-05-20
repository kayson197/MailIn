const nodeMailin = require("node-mailin");
const redis = require("redis");
const util = require('util');
const client = redis.createClient();
client.get = util.promisify(client.get);
client.lrange = util.promisify(client.lrange);
var bodyParser = require('body-parser');
const htmlspecialchars = require('htmlspecialchars');
const urlencode = require('rawurlencode');
// var quotedPrintable = require('quoted-printable');
// var utf8 = require('utf8');
// fs = require('fs');
const { convert } = require('html-to-text');

const LAST50_KEY = 'LAST50';
const PATTERNS_KEY = 'PATTERNS';

client.on("error", function(error) {
    console.error(error);
});

const express = require('express')
 var path = require('path');
const app = express();
const port = 4000;
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded());
app.use(express.static(path.join(__dirname, 'public')));
var jsonParser = bodyParser.json()
app.get('/', (req, res) => {
    res.render('mail', {
      title: 'VINIO MAIL'
    });
})

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

let patternsOld = [
    "One\-Time\-Password \(OTP\): {$number}",
    "(https?://api.clim8invest.com/mobile-app/no-auth/api/v1/login/[^\s'\"]+)",
    "confirmation code is: {$number}",
    '<div style="[^"]+">{$number}',
    "Verification code: {$number}",
    "one-time verification code you requested: {$number}",
    // "Z%-!.*?\(B\]{$number}",
    "your confirmation code. {$number}",
    '(https?://accounts.[\w]+.gigya.com[^\s"\']+)',
    "use your pin here {$number}",
    "Verify \([^\(]+\) {$number}",
    // "#mytaylormadeplus\) $number",
    "Magic Pin mobile application. {$number}",
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
    // magisto
    "confirm your email ({$link})",
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
    "verification code :? {$alphaNumber}",
    '\\[{$link}]'
];

const number = '([\\d]{3,})(?=[^d])';
const alphaNumber = '([\\w]{3,})';
const link = '(https?://[^\\s]+)';
const linkMarkdown = '<(http[^>]+)>';

function cleanPattern(value){
  let s_pattern = value.replace('{$linkMarkdown}', linkMarkdown).replace('{$link}', link)
        .replace('{$alphaNumber}', alphaNumber).replace('{$number}', number).replace(/#/g,'');
  return s_pattern;
}

async function findVerificationText(sender, input)
{
  try {
    const patterns = await client.lrange(PATTERNS_KEY, 0, -1);
    var appDomain = "";
    sender = sender.toLowerCase();
    // Check in not emptyApp
    for (var item of patterns) {
      var pattern = JSON.parse(item);
      // Extracting code
      if( pattern != null && (sender == "test" || sender.includes(pattern.appDomain.toLowerCase()) )  ){
        if(sender == "test"
            || pattern.uniqueContent == ""
            || pattern.uniqueContent == null
            || pattern.uniqueContent == undefined
            ||  (pattern.uniqueContent != "" && input.includes(pattern.uniqueContent) )
          ){
            let m;
            let regex = RegExp(cleanPattern(pattern.pattern), 'g');
            let array1;
            appDomain = pattern.appDomain;
            while ((array1 = regex.exec(input)) !== null) {
              if(array1[1] != undefined){
                let result = array1[1].trim();
                return {"result": result, "pattern": pattern.pattern, "appDomain": pattern.appDomain, "uniqueContent": pattern.uniqueContent};
              }
            }
        }
      }
    }
  } catch (e) {
    console.log(e);
  }
  // appDomain = sender.split('@');
  return {"result": "", "pattern": "", "appDomain": appDomain};
}

nodeMailin.start({
    port: 25
});

/* Access simplesmtp server instance. */
nodeMailin.on("authorizeUser", function(connection, username, password, done) {
    if (username == "johnsmith" && password == "mysecret") {
        done(null, true);
    } else {
        done(new Error("Unauthorized!"), false);
    }
});

/* Event emitted when the "From" address is received by the smtp server. */
nodeMailin.on('validateSender', async function(session, address, callback) {
    if (address == 'foo@bar.com') { /*blacklist a specific email adress*/
        err = new Error('You are blocked'); /*Will be the SMTP server response*/
        err.responseCode = 530; /*Will be the SMTP server return code sent back to sender*/
        callback(err);
    } else {
        callback()
    }
});

/* Event emitted when the "To" address is received by the smtp server. */
nodeMailin.on('validateRecipient', async function(session, address, callback) {
    console.log(address)
    /* Here you can validate the address and return an error
 *      * if you want to reject it e.g:
 *           *     err = new Error('Email address not found on server');
 *                *     err.responseCode = 550;
 *                     *     callback(err);*/
    callback()
});

/* Event emitted when a connection with the Node-Mailin smtp server is initiated. */
nodeMailin.on("startMessage", function(connection) {
    /* connection = {
   *       from: 'sender@somedomain.com',
   *             to: 'someaddress@yourdomain.com',
   *                   id: 't84h5ugf',
   *                         authentication: { username: null, authenticated: false, status: 'NORMAL' }
   *                             }
   *                               }; */
    console.log(connection);
});

/* Event emitted after a message was received and parsed. */
nodeMailin.on("message", async function(connection, data, content) {
    console.log(data);
    const receiver = extractEmail(data['to']['text']).toLowerCase();
    const sender = extractEmail(data['envelopeFrom']['address']);
    // console.log(sender);
    let htmlContent = data['html'];
    let mContent = convert(htmlContent, {
      wordwrap: 130
    });
    mContent = mContent.replace(/]/g,' ');
    mContent = mContent.replace(/\[/g,' ');
    mContent = mContent.replace(/\n/g,'').trim();
    // console.log(mContent);
    if(receiver != undefined && receiver.includes('@') && mContent != ""){
      const sfind = await findVerificationText(sender, mContent);
      var result = {};
      result['time'] = Date.now();
      result['from'] = sender;
      result['content'] = mContent;
      result['code'] = sfind==null?"":sfind.result;
      result['pattern'] = sfind==null?"":sfind.pattern;
      result['appDomain'] = sfind==null?"":sfind.appDomain;
      result['uniqueContent'] = sfind==null?"":sfind.uniqueContent;
      if(sfind != null && sfind.pattern != ""){
        // console.log(result);
        //here key will expire after 24 hours
       client.setex(receiver, 24*60*60, JSON.stringify(result), function(err, rs) {
         console.log(rs);
       });
      }
      // console.log('sfind: ' + sfind.result);

     var fullDetail = result;
     fullDetail['receiver'] = receiver;
     client.LLEN(LAST50_KEY, function(err, len) {
       console.log("LLEN: " + len);
       if(len >= 50){
         console.log("remove last");
         client.RPOP(LAST50_KEY);
       }
     });
     client.LPUSH(LAST50_KEY, JSON.stringify(fullDetail));
    }
});

nodeMailin.on("error", function(error) {
    console.log(error);
});

app.get('/api/verify/email/:email/:timeout', async (req, res) => {
    // result = {"success":false,"error":"No data found","data":null}
    let data = null;
    const email = req.params.email.toLowerCase();
    // const email =  req.query.email;
    let timeout = 10000;
    if(req.query.timeout != null)
      timeout =  parseInt(req.query.timeout);
    let value = await client.get(email);
    let result = {};
    if (value){
        data = JSON.parse(value);
        let result = {"success":true,"error":"","data":data.code,"content":data.content, "from":data.from};
        console.log(result);
        res.send(result);
    }
    else {
        res.send({"success":false,"error":"No data found","data":null,"content":"", "from":""});
    }
})


app.get('/api/email/patterns/clear', async (req, res) => {
    client.del(PATTERNS_KEY, function(err, response) {
       if (response == 1) {
          console.log("Deleted Successfully!");
          res.send("Deleted Successfully!");
       } else{
        console.log("Cannot delete");
        res.send("Cannot delete");
       }
    });
})

app.get('/emails', async (req, res) => {
    // result = {"success":false,"error":"No data found","data":null}
    const email =  req.query.email;
    const values = await client.lrange(PATTERNS_KEY, 0, -1);
    const last50 = await client.lrange(LAST50_KEY, 0, -1);
    client.keys('*', function (err, keys) {
      if (err) return console.log(err);
      console.log(keys.length);
      res.render('mail', {
        title: 'VINIO MAIL',
        patterns: values,
        last50: last50,
        total: keys.length-2
      });
    });
})

app.get('/api/email/last50', async (req, res) => {
    const last50 = await client.lrange(LAST50_KEY, 0, -1);
    client.keys('*', function (err, keys) {
      if (err) return console.log(err);
      res.send({"last50": last50, "total": keys.length -2 });
    });
})

function validatePattern(pattern){
    if (pattern.includes('{$link}') || pattern.includes('{$number}') || pattern.includes('{$alphaNumber}')  || pattern.includes('{$linkMarkdown}')
        ||pattern.includes(link) ||pattern.includes(number) ||pattern.includes(alphaNumber) ||pattern.includes(linkMarkdown) ){
        return true;
    }
    return true;
}

app.post('/api/email/patterns/',  async (req, res) => {
    const pattern = req.body['pattern'];
    const appDomain = req.body['appDomain'];
    // console.log(pattern);
    if (pattern && validatePattern(pattern)){
        client.rpush(PATTERNS_KEY, JSON.stringify(req.body), async function(err, value) {
            // reply is null when the key is missing
            res.send(req.body);
        });
    }
    else {
        let text = 'Invalid format, please try again! Valid format examples: '
        text += 'Confirm {$link}' + ' | '
        text += 'Confirm {$number}' + ' | '
        text += 'Confirm {$alphaNumber}' + '<br/>'
        return res.status(400).send({
           message: text
        });
    }
});

app.delete('/api/email/patterns/',  async (req, res) => {
    // result = {"success":false,"error":"No data found","data":null}
    // const email =  req.query.email;
    const pattern = req.body['pattern'];
    console.log(pattern);

    client.lrem(PATTERNS_KEY, 0, pattern, function(err, data){
      console.log(data); // Tells how many entries got deleted from the list
      res.send("deleted: " + data +" record");
    });
});

app.patch('/api/email/patterns/',  async (req, res) => {
    // result = {"success":false,"error":"No data found","data":null}
    // const email =  req.query.email;
    const pattern = req.body['pattern'];
    const idx = req.body['index'];
    console.log(pattern);

    client.lset(PATTERNS_KEY, idx, pattern, function(err, data){
      console.log(data); // Tells how many entries got deleted from the list
      res.send(data);
    });
});

app.post('/api/email/test/',  async (req, res) => {
  const input = req.body['input'];
  let pattern = req.body['pattern'];
  let appDomain = req.body['appDomain'];
  let uniqueContent = req.body['uniqueContent'];
  appDomain = appDomain==''?'test':appDomain;
  try {
    console.log('input: ' + input);
    console.log('pattern: ' + pattern)
    if(pattern == ""){
      var response = await findVerificationText(appDomain, input);
      return res.send(response);
    }else{
      if(validatePattern(pattern)){
        let regex = RegExp(cleanPattern(pattern), 'g');
        let array1;
        while ((array1 = regex.exec(input)) !== null) {
          if(array1[1] != undefined){
            // console.log(`Found ${array1[1]}. Next starts at ${regex.lastIndex}.`);
            var result = array1[1].trim();
            console.log("result: " + result);
            return res.send({"result": result, "pattern": pattern, "appDomain": appDomain, "uniqueContent": ""});
          }
        }
      }else {
        return res.status(400).send({
           message: 'pattern incorrect format'
        });
      }
    }
  } catch (e) {
    console.log(e);
    return res.status(400).send({
       message: e.message
    });
  }
  return res.send({"result": "", "pattern": pattern, "appDomain": appDomain});
})



async function initRedis(patternKey){
  // Check PATTERNS_KEY
  client.exists(patternKey, function(err, reply) {
    if (reply === 1) {
      console.log('PATTERNS_KEY exists');
    } else {
      client.rpush(patternKey, patternsOld);
      console.log("Inserted");
    }
  });
}

function extractEmail(str){
  try{
    var regex = /<(.*)>/g; // The actual regex
    var matches = regex.exec(str);
    if(matches != null)
      return matches[1];
    else
      return str;
  }catch{}
  return str;
}


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);

    // console.log(extractEmail("<bounces+6546160-4435-dangduc=ducphe.xyz@em6458.rain.bh"));
      // initRedis(PATTERNS_KEY);
})
