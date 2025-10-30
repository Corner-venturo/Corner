(async () => {
  const { localDB } = await import('/src/lib/db/index.ts');

  const events = await localDB.getAll('calendar_events');
  console.log('Calendar Events:', events);

  const employees = await localDB.getAll('employees');
  console.log('Employees:', employees);

  const companyEvents = events.filter(e => e.visibility === 'company');
  console.log('Company Events:', companyEvents);

  if (companyEvents.length > 0) {
    const event = companyEvents[0];
    console.log('First company event created_by:', event.created_by);
    console.log('Type:', typeof event.created_by);

    const creator = employees.find(emp => emp.id === event.created_by);
    console.log('Found creator:', creator);
  }
})();
