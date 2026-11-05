// ISATS application mailer - runs inside the isats.sales1@gmail.com Google account.
// Receives the Apply form and emails details + PDFs to MAIL_TO. No password needed.

var MAIL_TO = 'isats.sales1@gmail.com';

var STATUS_LABELS = { tenth: '10th pass', twelfth: '12th pass', graduate: 'Graduate' };

var REQUIRED_DOCS = {
  tenth: { tenthCertificate: '10th passing certificate' },
  twelfth: { twelfthCertificate: '12th passing certificate' },
  graduate: {
    degreeCertificate: 'Degree completion certificate',
    degreeMarksheet1: 'First year marksheet',
    degreeMarksheet2: 'Second year marksheet',
    degreeMarksheet3: 'Third year marksheet',
    degreeMarksheet4: 'Fourth year marksheet'
  }
};

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function esc(v) {
  return String(v).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function safeName(v) {
  return String(v).replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '').slice(0, 60) || 'applicant';
}

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var name = String(d.fullName || '').trim();
    var phone = String(d.phone || '').trim();
    var email = String(d.email || '').trim();
    var status = String(d.academicStatus || '');

    if (!name || name.length > 100) return respond({ ok: false, error: 'Invalid name.' });
    if (!/^[+\d][\d\s-]{8,14}$/.test(phone)) return respond({ ok: false, error: 'Invalid phone number.' });
    if (!/^\S+@\S+\.\S+$/.test(email)) return respond({ ok: false, error: 'Invalid email address.' });
    if (!REQUIRED_DOCS[status]) return respond({ ok: false, error: 'Invalid academic status.' });

    var required = REQUIRED_DOCS[status];
    var docs = d.documents || [];
    var byId = {};
    docs.forEach(function (doc) { byId[doc.id] = doc; });

    for (var id in required) {
      if (!byId[id]) return respond({ ok: false, error: 'Missing document: ' + required[id] + '.' });
    }

    var attachments = [];
    var rows = '';
    for (var i = 0; i < docs.length; i++) {
      var doc = docs[i];
      var isExtra = status === 'graduate' && /^degreeMarksheetExtra[1-9]$/.test(doc.id);
      if (!required[doc.id] && !isExtra) return respond({ ok: false, error: 'Unexpected document.' });
      // "%PDF-" in base64 always starts with "JVBERi0"
      if (String(doc.data || '').indexOf('JVBERi0') !== 0) {
        return respond({ ok: false, error: 'A document is not a valid PDF.' });
      }
      var label = required[doc.id] || 'Additional marksheet ' + doc.id.replace('degreeMarksheetExtra', '');
      var blob = Utilities.newBlob(Utilities.base64Decode(doc.data), 'application/pdf',
        safeName(label) + '_' + safeName(name) + '.pdf');
      attachments.push(blob);
      rows += '<tr><td style="padding:6px 12px;border:1px solid #e2e8f0">' + esc(label) +
        '</td><td style="padding:6px 12px;border:1px solid #e2e8f0">' + esc(doc.name || '') + '</td></tr>';
    }

    var cell = 'padding:6px 12px;border:1px solid #e2e8f0';
    var html =
      '<div style="font-family:Arial,sans-serif;color:#0f172a;max-width:640px">' +
      '<h2 style="margin:0 0 12px">New admission application</h2>' +
      '<table style="border-collapse:collapse;margin-bottom:16px">' +
      '<tr><td style="' + cell + '"><b>Name</b></td><td style="' + cell + '">' + esc(name) + '</td></tr>' +
      '<tr><td style="' + cell + '"><b>Phone</b></td><td style="' + cell + '">' + esc(phone) + '</td></tr>' +
      '<tr><td style="' + cell + '"><b>Email</b></td><td style="' + cell + '">' + esc(email) + '</td></tr>' +
      '<tr><td style="' + cell + '"><b>Academic status</b></td><td style="' + cell + '">' + STATUS_LABELS[status] + '</td></tr>' +
      '</table><h3 style="margin:0 0 8px">Documents attached (' + attachments.length + ')</h3>' +
      '<table style="border-collapse:collapse">' + rows + '</table>' +
      '<p style="color:#475569;font-size:13px;margin-top:16px">Reply to this email to contact the applicant directly.</p></div>';

    MailApp.sendEmail({
      to: MAIL_TO,
      replyTo: email,
      subject: 'New application: ' + name + ' (' + STATUS_LABELS[status] + ')',
      htmlBody: html,
      attachments: attachments,
      name: 'ISATS Website'
    });

    // Acknowledgement to the applicant; must not fail the application
    try {
      MailApp.sendEmail({
        to: email,
        subject: 'We received your ISATS application',
        htmlBody: '<div style="font-family:Arial,sans-serif;color:#0f172a"><p>Hi ' + esc(name.split(' ')[0]) +
          ',</p><p>Thank you for applying to ISATS. We have received your documents and our admissions team ' +
          'will verify them and get back to you soon.</p><p>Regards,<br/>ISATS Admissions</p></div>',
        name: 'ISATS'
      });
    } catch (ackError) {}

    return respond({ ok: true });
  } catch (err) {
    return respond({ ok: false, error: 'Could not send your application. Please try again.' });
  }
}
