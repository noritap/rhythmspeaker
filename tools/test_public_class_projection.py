import copy,unittest
from public_class_projection import project
class Projection(unittest.TestCase):
 def setUp(self):
  self.e=dict(publicApproved=True,kind='lesson',summary='OPEN STEP',calendarKey='PRIVATE_CAL',eventKey='PRIVATE_EVENT',originalStart='OCCURRENCE',instructorId='teacher',classId='step',className='STEP',classType='STEP',start='2026-11-01T10:00:00+09:00',end='2026-11-01T11:00:00+09:00',attendees=['DO_NOT_PUBLISH'],description='PRIVATE_DESCRIPTION')
  self.people=[dict(id='teacher',name='公開講師',classes=['STEP'])];self.mapping={('PRIVATE_CAL','PRIVATE_EVENT','OCCURRENCE'):'public-opaque-1'}
 def run_projection(self,events):return project(events,self.people,self.mapping,'2026-10-31T10:00:00+09:00')
 def test_allowlist_and_unknown_count(self):
  x=self.run_projection([self.e]);self.assertEqual(len(x['sessions']),1);self.assertIsNone(x['sessions'][0]['confirmedBookingCount']);self.assertNotIn('PRIVATE',str(x));self.assertNotIn('DO_NOT_PUBLISH',str(x))
 def test_exclusions(self):
  for patch in [dict(publicApproved=False),dict(kind='rental'),dict(summary='CLOSE'),dict(summary='REOPEN'),dict(instructorId='unknown')]:
   e=copy.deepcopy(self.e);e.update(patch);self.assertEqual(self.run_projection([e])['sessions'],[])
 def test_duplicate_and_cancel(self):
  e=copy.deepcopy(self.e);e['cancelled']=True;x=self.run_projection([e,e]);self.assertEqual(len(x['sessions']),1);self.assertEqual(x['sessions'][0]['publicStatus'],'CANCELLED')
if __name__=='__main__':unittest.main()
