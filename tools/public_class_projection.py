"""Pure server-side projection contract. No network/auth/calendar settings or writes.
Caller owns a PRIVATE stable identity -> opaque public-ID mapping; never publish it.
Input must be explicitly approved normalized events, not an unfiltered calendar export.
"""
from datetime import datetime
from zoneinfo import ZoneInfo
import re

def project(events, instructors, identity_map, generated_at):
    people={p['id']:p for p in instructors}
    rows=[]; seen=set()
    for event in events:
        # Rentals/CLOSE/private events are not teacher availability.
        if event.get('publicApproved') is not True or event.get('kind')!='lesson':continue
        if not re.search(r'(?<!\w)OPEN(?!\w)',event.get('summary','')):continue
        key=(event.get('calendarKey'),event.get('eventKey'),event.get('originalStart'))
        public_id=identity_map.get(key)
        if not public_id or public_id in seen:continue
        person=people.get(event.get('instructorId'))
        if not person or event.get('classType') not in person.get('classes',[]):continue
        start=datetime.fromisoformat(event['start'])
        if start.utcoffset() is None:raise ValueError('Timezone required')
        start=start.astimezone(ZoneInfo('Asia/Tokyo'))
        end=datetime.fromisoformat(event['end'])
        if end.utcoffset() is None:raise ValueError('Timezone required')
        end=end.astimezone(ZoneInfo('Asia/Tokyo'))
        if not isinstance(event.get('approvedCapacity',10),int) or event.get('approvedCapacity',10)<1:raise ValueError('Capacity invalid')
        if end<=start or start.date()!=end.date():raise ValueError('Invalid class time range')
        # Counts require a separate confirmed-reservation aggregate; never infer from titles/attendees.
        rows.append(dict(id=public_id,classId=event['classId'],className=event['className'],
          date=start.date().isoformat(),start=start.strftime('%H:%M'),end=end.strftime('%H:%M'),
          classType=event['classType'],level=event.get('publicLevel',''),instructorId=person['id'],
          instructorName=person['name'],source='live',publicStatus='CANCELLED' if event.get('cancelled') else 'OPEN',
          confirmedBookingCount=None,bookingCountStatus='unknown',bookingCountSource=None,
          capacity=event.get('approvedCapacity',10),updatedAt=generated_at))
        seen.add(public_id)
    return dict(version='class-reservation-v1.3',sourceMode='live',dataState='ready',timezone='Asia/Tokyo',
       generatedAt=generated_at,lastSuccessfulSyncAt=generated_at,lastAttemptAt=generated_at,
       sessions=sorted(rows,key=lambda r:(r['date'],r['start'],r['id'])))
