import { useState } from "react";
import { submitEnquiry } from "../api.js";
import Layout from "../components/Layout.jsx";

const EMPTY = { name: "", phone: "", quantity: "", purpose: "" };

const validators = {
  name: (value) => (value.trim().length >= 2 ? "" : "Please enter your name."),
  phone: (value) =>
    /^\+?[0-9][0-9\s-]{6,16}$/.test(value.trim()) ? "" : "Please enter a valid phone number.",
  quantity: (value) =>
    /^\d+$/.test(value.trim()) && Number(value) >= 1 ? "" : "Please enter a quantity of 1 or more.",
  purpose: (value) => (value.trim() ? "" : "Please tell us the purpose of the order."),
};

export default function EnquiryForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: validators[name](value) }));
    }
  }

  function handleBlur(event) {
    const { name, value } = event.target;
    setErrors((current) => ({ ...current, [name]: validators[name](value) }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus(null);

    const nextErrors = {};
    for (const field of Object.keys(validators)) {
      nextErrors[field] = validators[field](values[field]);
    }
    setErrors(nextErrors);

    const firstInvalid = Object.keys(nextErrors).find((field) => nextErrors[field]);
    if (firstInvalid) {
      event.target.elements[firstInvalid].focus();
      return;
    }

    setSubmitting(true);
    try {
      await submitEnquiry({
        name: values.name.trim(),
        phone: values.phone.trim(),
        quantity: Number(values.quantity),
        purpose: values.purpose.trim(),
      });
      setValues(EMPTY);
      setStatus({
        type: "success",
        message: "Thank you! We've received your enquiry and will contact you soon.",
      });
    } catch (error) {
      if (error.errors) setErrors((current) => ({ ...current, ...error.errors }));
      setStatus({ type: "failure", message: error.message });
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass = (name) => (errors[name] ? "field invalid" : "field");

  return (
    <Layout>
      <main className="enquiry">
        <section className="intro">
          <span className="eyebrow">Bulk orders</span>
          <h1>Ordering Xtovia in bulk?</h1>
          <p className="intro-text">
            Tell us how many units you need and what they're for. Our team will call you back on the
            number you share.
          </p>
          <ol className="steps">
            <li>
              <span className="step-number">1</span>
              <span>Fill in the short form</span>
            </li>
            <li>
              <span className="step-number">2</span>
              <span>We review your requirement</span>
            </li>
            <li>
              <span className="step-number">3</span>
              <span>Our team gets in touch with you</span>
            </li>
          </ol>
        </section>

        <section className="card">
          <h2>Bulk Order Enquiry</h2>
          <p className="subtitle">All fields are required.</p>

          <form className="form-grid" onSubmit={handleSubmit} noValidate>
            <div className={`${fieldClass("name")} span-2`}>
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                autoComplete="name"
                maxLength={80}
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {errors.name && <div className="error">{errors.name}</div>}
            </div>

            <div className={fieldClass("phone")}>
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                autoComplete="tel"
                inputMode="tel"
                placeholder="+91 98765 43210"
                value={values.phone}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {errors.phone && <div className="error">{errors.phone}</div>}
            </div>

            <div className={fieldClass("quantity")}>
              <label htmlFor="quantity">Bulk Quantity</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                inputMode="numeric"
                min="1"
                step="1"
                value={values.quantity}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {errors.quantity && <div className="error">{errors.quantity}</div>}
            </div>

            <div className={`${fieldClass("purpose")} span-2`}>
              <label htmlFor="purpose">Purpose</label>
              <textarea
                id="purpose"
                name="purpose"
                maxLength={500}
                placeholder="e.g. corporate gifting, Family functions, event"
                value={values.purpose}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {errors.purpose && <div className="error">{errors.purpose}</div>}
            </div>

            <button type="submit" className="primary span-2" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Enquiry"}
            </button>

            {status && (
              <div className={`status ${status.type} span-2`} role="status">
                {status.message}
              </div>
            )}
          </form>
        </section>
      </main>
    </Layout>
  );
}
