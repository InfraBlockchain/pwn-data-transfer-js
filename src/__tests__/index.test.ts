import IcalConverter from '../lib/ical2rdf';
import PwnDataInput from '../index';

jest.setTimeout(1000 * 60 * 10);
const MOCK_ICS = `
BEGIN:VCALENDAR
PRODID:-//Google Inc//Google Calendar 70.9054//EN
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:evan@infrablockchain.com
X-WR-TIMEZONE:Asia/Seoul
BEGIN:VEVENT
DTSTART:20220317T093000Z
DTEND:20220317T103000Z
DTSTAMP:20231213T012114Z
UID:60r30dhgclhmcb9n64r68b9kclj6cbb1c5ijcb9i64sj6d1h6tgj4dr66k@google.com
CREATED:20220312T003704Z
DESCRIPTION:
LAST-MODIFIED:20220312T003704Z
LOCATION:
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:YT 저녁식사
TRANSP:OPAQUE
END:VEVENT
BEGIN:VEVENT
DTSTART;VALUE=DATE:20220519
DTEND;VALUE=DATE:20220520
DTSTAMP:20231213T012114Z
UID:EC0082E4-DDC4-444F-BA87-02FF7B087196
CREATED:20220516T003603Z
DESCRIPTION:
LAST-MODIFIED:20220518T000003Z
LOCATION:
SEQUENCE:1
STATUS:CONFIRMED
SUMMARY:신사스퀘어 결과발표
TRANSP:TRANSPARENT
X-APPLE-TRAVEL-ADVISORY-BEHAVIOR:AUTOMATIC
BEGIN:VALARM
ACTION:AUDIO
TRIGGER:-PT15H
X-WR-ALARMUID:197D901B-589A-4CE1-842F-B6C8C145567A
UID:197D901B-589A-4CE1-842F-B6C8C145567A
ATTACH;VALUE=URI:Chord
X-APPLE-DEFAULT-ALARM:TRUE
ACKNOWLEDGED:20220518T000003Z
END:VALARM
END:VEVENT
BEGIN:VEVENT
DTSTART:20231128T053000Z
DTEND:20231128T063000Z
DTSTAMP:20231213T012114Z
ORGANIZER;CN=yul@bc-labs.net:mailto:yul@bc-labs.net
UID:37u1s1n8pdqolonqedsgmlujg0@google.com
ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=jasony
  oo@bc-labs.net;X-NUM-GUESTS=0:mailto:jasonyoo@bc-labs.net
ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;CN=ja
  ke@bc-labs.net;X-NUM-GUESTS=0:mailto:jake@bc-labs.net
ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=yul@bc
  -labs.net;X-NUM-GUESTS=0:mailto:yul@bc-labs.net
ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=evan@i
  nfrablockchain.com;X-NUM-GUESTS=0:mailto:evan@infrablockchain.com
ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=hajin@
  bc-labs.net;X-NUM-GUESTS=0:mailto:hajin@bc-labs.net
X-GOOGLE-CONFERENCE:https://meet.google.com/ppp-ffqg-sxt
CREATED:20231128T044448Z
DESCRIPTION:-::~:~::~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~
  :~:~:~:~:~:~:~:~::~:~::-\nJoin with Google Meet: https://meet.google.com/pp
  p-ffqg-sxt\nOr dial: (US) +1 413-338-4533 PIN: 802331784#\nMore phone numbe
  rs: https://tel.meet/ppp-ffqg-sxt?pin=5006000140015&hs=7\n\nLearn more abou
  t Meet at: https://support.google.com/a/users/answer/9282720\n\nPlease do n
  ot edit this section.\n-::~:~::~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:
  ~:~:~:~:~:~:~:~:~:~:~:~:~:~::~:~::-
LAST-MODIFIED:20231128T050357Z
LOCATION:9A
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:Newnal Demo 방향성 논의
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR
`;
describe('Module Test', () => {
  test('convertIcal', () => {
    const res = PwnDataInput.convertIcal(MOCK_ICS);
    expect(res).toBeDefined();
    expect(
      res.includes('@prefix cal: <http://www.w3.org/2002/12/cal/ical#>.')
    ).toBeTruthy();
  });
});

describe('Lib Test', () => {
  test('ical to rdf', () => {
    const res = IcalConverter.convert(MOCK_ICS);
    console.log(res);
    expect(res).toBeDefined();
    expect(
      res.includes('@prefix cal: <http://www.w3.org/2002/12/cal/ical#>.')
    ).toBeTruthy();
  });
});
