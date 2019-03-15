/**
 * 
Mailbox configuration
 * */
const gMmailboxConfig={	
	host: 'mail.mail.it',
	port: 587,
	tls: {
		ciphers:'SSLv3',
		rejectUnauthorized: false
	},
	debug:true,
	auth: {
		user: 'mail@mail.it',
		pass: 'password'
	}
};
	
/**
 * send a mail
 * @param recipient list comma separated email address recipients
 * @param subject 
 * @param text 
 * @param htmlText text with html formatting
 * */
module.exports.sendMail = function(recipient, subject, text, htmlText = ""){
	var nodemailer = require('nodemailer');

	var transporter = nodemailer.createTransport(gMmailboxConfig);

	
	transporter.verify(function(error, success) {
		if (error) 
			console.log(error);
		else 
		{
			var mailOptions = {
				from: '"Mail" <mail@mail.it>', // sender address
				to: recipient, // list of receivers
				subject: subject, // Subject line
				html: htmlText, // html body
				text: text
			};

			transporter.sendMail(mailOptions, function(error, info){
				if(error)
					console.log(error);
				else
					console.log('Message sent: ' + info.response);
			});
		}
	});
}


