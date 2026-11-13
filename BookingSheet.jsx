import { useEffect, useState } from 'react';
import { Close, Minus, Plus } from './icons';
import { fmtTime } from '../lib/assistant';

const PLATE = /^([A-Z]{2}\s?\d{1,2}\s?[A-Z]{0,3}\s?\d{1,4}|\d{2}\s?BH\s?\d{4}\s?[A-Z]{1,2})$/;
export const FEE = { car: 10, bike: 5 };

export default function BookingSheet({ spot, vehicle, when, vehicles, hasPass, onClose, onConfirm }) {
  const own = vehicles.filter((v) => v.type === vehicle);
  const [hours, setHours] = useState(2);
  const [plate, setPlate] = useState(own[0]?.plate || '');
  const [pay, setPay] = useState('upi');
  const [step, setStep] = useState('details');
  const clean = plate.toUpperCase().replace(/\s+/g, ' ').trim();
  const valid = PLATE.test(clean);
  const start = when < new Date() ? new Date() : when;
  const end = new Date(start.getTime() + hours * 3600000);
  const parking = spot.rate[vehicle] * hours;
  const fee = hasPass ? 0 : FEE[vehicle];
  const payOnArrival = spot.type === 'civic' || spot.type === 'transit';

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Reserve parking" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div>
            <h2>{spot.name}</h2>
            <p className="sub">{spot.area}</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Close /></button>
        </div>

        {step === 'details' && (
          <>
            <div className="field">
              <span>How long</span>
              <div className="stepper">
                <button onClick={() => setHours(Math.max(1, hours - 1))} aria-label="Less time"><Minus /></button>
                <strong>{hours} hr{hours > 1 ? 's' : ''}</strong>
                <button onClick={() => setHours(Math.min(12, hours + 1))} aria-label="More time"><Plus /></button>
              </div>
              <span className="fine">{fmtTime(start)} to {fmtTime(end)}</span>
            </div>

            <label className="field">
              <span>{vehicle === 'car' ? 'Car' : 'Bike'} number</span>
              {own.length > 0 && (
                <div className="chips">
                  {own.map((v) => (
                    <button key={v.plate} type="button" className={`chip ghost${clean === v.plate ? ' on' : ''}`} onClick={() => setPlate(v.plate)}>{v.plate}</button>
                  ))}
                </div>
              )}
              <input className="plate-input" value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="MH 12 AB 1234" autoCapitalize="characters" />
              {plate && !valid && <span className="err">That doesn't look like a number plate. Try the format MH 12 AB 1234.</span>}
            </label>

            <div className="field">
              <span>Pay with</span>
              <div className="seg">
                {[['upi', 'UPI'], ['card', 'Card'], ['cash', payOnArrival ? 'Cash at lot' : 'Pay at exit']].map(([k, l]) => (
                  <button key={k} className={pay === k ? 'on' : ''} onClick={() => setPay(k)}>{l}</button>
                ))}
              </div>
            </div>

            <dl className="bill">
              <div><dt>Parking, {hours} hr at ₹{spot.rate[vehicle]}</dt><dd>₹{parking}</dd></div>
              <div><dt>Booking fee{hasPass ? ' (waived with Pass)' : ''}</dt><dd>₹{fee}</dd></div>
              <div className="total"><dt>Total</dt><dd>₹{parking + fee}</dd></div>
            </dl>

            <button className="btn primary wide" disabled={!valid} onClick={() => setStep('pay')}>
              {pay === 'cash' ? 'Confirm' : `Pay ₹${parking + fee}`}
            </button>
            <p className="fine">Demo checkout. No money moves. Production uses Razorpay test mode first, then live UPI.</p>
          </>
        )}

        {step === 'pay' && (
          <div className="paying">
            <p>Confirming your {pay === 'upi' ? 'UPI' : pay === 'card' ? 'card' : ''} payment…</p>
            <div className="kerb-loader" aria-hidden="true" />
            <PayTimer onDone={() => onConfirm({ hours, plate: clean, pay, start, end, amount: parking + fee, fee })} />
          </div>
        )}
      </div>
    </div>
  );
}

function PayTimer({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1100);
    return () => clearTimeout(t);
  }, []);
  return null;
}
