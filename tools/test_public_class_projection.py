import copy,unittest
from public_class_projection import project
class Projection(unittest.TestCase):
 def setUp(self):
  self.e=dict(publicApproved=True,kind='lesson',summary='OPEN STEP',admissionStatus='OPEN',calendarKey='PRIVATE_CAL',eventKey='PRIVATE_EVENT',originalStart='OCCURRENCE',instructorId='teacher',classId='step',className='STEP',classType='STEP',start='2026-11-01T10:00:00+09:00',end='2026-11-01T11:00:00+09:00',attendees=['DO_NOT_PUBLISH'],description='PRIVATE_DESCRIPTION')
  self.people=[dict(id='teacher',name='公開講師',classes=['STEP'])];self.mapping={('PRIVATE_CAL','PRIVATE_EVENT','OCCURRENCE'):'public-opaque-1'}
 def run_projection(self,events):return project(events,self.people,self.mapping,'2026-10-31T10:00:00+09:00')
 def test_allowlist_and_unknown_count(self):
  x=self.run_projection([self.e]);self.assertEqual(len(x['sessions']),1);self.assertIsNone(x['sessions'][0]['confirmedBookingCount']);self.assertNotIn('PRIVATE',str(x));self.assertNotIn('DO_NOT_PUBLISH',str(x))
 def test_exclusions(self):
  for patch in [dict(publicApproved=False),dict(kind='rental'),dict(instructorId='unknown')]:
   e=copy.deepcopy(self.e);e.update(patch);self.assertEqual(self.run_projection([e])['sessions'],[])
 def test_close_is_public_not_joinable(self):
  e=copy.deepcopy(self.e);e.update(summary='CLOSE',admissionStatus='CLOSE')
  x=self.run_projection([e]);self.assertEqual(len(x['sessions']),1);self.assertEqual(x['sessions'][0]['publicStatus'],'CLOSE')
 def test_unknown_marker_is_public_but_requires_inquiry(self):
  e=copy.deepcopy(self.e);e.update(summary='OTHER',admissionStatus='INQUIRY_ONLY')
  x=self.run_projection([e]);self.assertEqual(x['sessions'][0]['publicStatus'],'INQUIRY_ONLY')
 def test_missing_admission_status_fails_closed(self):
  e=copy.deepcopy(self.e);del e['admissionStatus']
  with self.assertRaises(ValueError):self.run_projection([e])
 def test_duplicate_and_cancel(self):
  e=copy.deepcopy(self.e);e['cancelled']=True;x=self.run_projection([e,e]);self.assertEqual(len(x['sessions']),1);self.assertEqual(x['sessions'][0]['publicStatus'],'CANCELLED')
if __name__=='__main__':unittest.main()
