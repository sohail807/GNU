import os
os.environ['TRYTOND_CONFIG'] = '/home/gnuhealth/trytond.conf'

from proteus import config, Model

# Set up native Tryton connection
cfg = config.set_trytond('gnuhealth', user='admin', config_file='/home/gnuhealth/trytond.conf')
print("Proteus native API connection established successfully!")

Patient = Model.get('gnuhealth.patient')
Appointment = Model.get('gnuhealth.appointment')
Evaluation = Model.get('gnuhealth.patient.evaluation')
Prescription = Model.get('gnuhealth.prescription.order')
Lab = Model.get('gnuhealth.lab')
Invoice = Model.get('account.invoice')

# 1. Patients retrieval
patients = Patient.find([('puid', 'like', 'DEMO%')])
print(f"1. Patients retrieved ({len(patients)}):")
for p in patients:
    print(f"   - PUID: {p.puid}, Name: {p.party.name}, ID: {p.id}")

# 2. Appointments retrieval
appointments = Appointment.find([('patient.puid', 'like', 'DEMO%')])
print(f"2. Appointments retrieved ({len(appointments)}):")
for a in appointments:
    print(f"   - Appt ID: {a.id}, Date: {a.appointment_date}, State: {a.state}, Patient: {a.patient.rec_name}")

# 3. Clinical Evaluations retrieval
evaluations = Evaluation.find([('patient.puid', 'like', 'DEMO%')])
print(f"3. Evaluations retrieved ({len(evaluations)}):")
for ev in evaluations:
    print(f"   - Eval ID: {ev.id}, Date: {ev.evaluation_start}, State: {ev.state}, Diag: {ev.diagnosis.rec_name if ev.diagnosis else 'None'}")

# 4. Prescriptions retrieval
prescriptions = Prescription.find([('patient.puid', 'like', 'DEMO%')])
print(f"4. Prescriptions retrieved ({len(prescriptions)}):")
for rx in prescriptions:
    print(f"   - Rx ID: {rx.id}, Date: {rx.prescription_date}, State: {rx.state}, Lines: {len(rx.prescription_line)}")

# 5. Laboratory Results retrieval
labs = Lab.find([('patient.puid', 'like', 'DEMO%')])
print(f"5. Lab orders retrieved ({len(labs)}):")
for lb in labs:
    print(f"   - Lab ID: {lb.id}, Test: {lb.test.name}, State: {lb.state}, Results: {lb.results[:40]}...")

# 6. Invoices retrieval
invoices = Invoice.find([('party.name', 'like', 'DEMO%')])
print(f"6. Invoices retrieved ({len(invoices)}):")
for inv in invoices:
    print(f"   - Invoice ID: {inv.id}, Number: {inv.number}, Total: {inv.total_amount} QAR, State: {inv.state}")
