const { Resend } = require("resend");

const resend = new Resend(
  process.env.RESEND_API_KEY
);

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL;

// ==========================================
// COMMON EMAIL WRAPPER
// ==========================================

const sendEmail = async ({
  to,
  subject,
  html,
}) => {
  try {
    if (!to) {
      console.error(
        "❌ Email recipient is missing."
      );

      return {
        success: false,
        error: "Email recipient is missing.",
      };
    }

    const { data, error } =
      await resend.emails.send({
        from:
          "PujaBooking <onboarding@resend.dev>",

        to: [to],

        subject,

        html,
      });

    if (error) {
      console.error(
        "❌ Resend email error:",
        error
      );

      return {
        success: false,
        error,
      };
    }

    console.log(
      "✅ Email sent successfully:",
      data?.id
    );

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error(
      "❌ Email service error:",
      error
    );

    return {
      success: false,
      error,
    };
  }
};

// ==========================================
// 1. BOOKING RECEIVED EMAIL
// CUSTOMER
// ==========================================

const sendBookingEmail = async ({
  to,
  customerName,
  pujaName,
  bookingId,
  bookingDate,
  bookingTime,
}) => {
  return sendEmail({
    to,

    subject:
      "PujaBooking – Booking Received",

    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 30px;
        color: #333;
      ">

        <div style="
          text-align: center;
          background: #fff7ed;
          padding: 20px;
          border-radius: 12px;
        ">
          <h1 style="
            color: #c2410c;
            margin: 0;
          ">
            🙏 PujaBooking
          </h1>

          <p style="
            color: #7c2d12;
            margin-top: 8px;
          ">
            परंपरा • श्रद्धा • संस्कार
          </p>
        </div>

        <div style="
          padding: 20px 5px;
        ">

          <h2 style="
            color: #9a3412;
          ">
            Booking Received
          </h2>

          <p>
            Namaste ${customerName} Ji,
          </p>

          <p>
            Your Puja booking request has been
            received successfully.
          </p>

          <div style="
            background: #fff7ed;
            border: 1px solid #fed7aa;
            border-radius: 10px;
            padding: 18px;
            margin: 20px 0;
          ">

            <p>
              <strong>Puja:</strong>
              ${pujaName}
            </p>

            <p>
              <strong>Date:</strong>
              ${bookingDate}
            </p>

            <p>
              <strong>Time:</strong>
              ${bookingTime}
            </p>

            <p>
              <strong>Booking ID:</strong>
              ${bookingId}
            </p>

          </div>

          <p>
            Our team will verify your payment and
            confirm your booking.
          </p>

          <p>
            You will receive further updates about
            your Puja booking by email.
          </p>

          <p style="
            margin-top: 30px;
          ">
            Thank you for choosing PujaBooking.
          </p>

          <p>
            🙏 Jai Shri Ganesh
          </p>

        </div>

        <div style="
          border-top: 1px solid #e5e7eb;
          padding-top: 15px;
          font-size: 12px;
          color: #777;
          text-align: center;
        ">
          PujaBooking<br />
          Traditional Vedic Puja Services
        </div>

      </div>
    `,
  });
};

// ==========================================
// 2. PAYMENT VERIFIED EMAIL
// CUSTOMER
// ==========================================

const sendPaymentVerifiedEmail = async ({
  to,
  customerName,
  pujaName,
  bookingId,
  bookingDate,
  bookingTime,
  amount,
  utr,
}) => {
  return sendEmail({
    to,

    subject:
      "PujaBooking – Payment Verified",

    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 30px;
        color: #333;
      ">

        <div style="
          text-align: center;
          background: #fff7ed;
          padding: 20px;
          border-radius: 12px;
        ">

          <h1 style="
            color: #c2410c;
            margin: 0;
          ">
            🙏 PujaBooking
          </h1>

          <p style="
            color: #7c2d12;
            margin-top: 8px;
          ">
            परंपरा • श्रद्धा • संस्कार
          </p>

        </div>

        <div style="
          padding: 20px 5px;
        ">

          <h2 style="
            color: #15803d;
          ">
            ✅ Payment Verified
          </h2>

          <p>
            Namaste ${customerName} Ji,
          </p>

          <p>
            Your payment has been successfully
            verified and your Puja booking is now
            confirmed.
          </p>

          <div style="
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 10px;
            padding: 18px;
            margin: 20px 0;
          ">

            <p>
              <strong>Puja:</strong>
              ${pujaName}
            </p>

            <p>
              <strong>Date:</strong>
              ${bookingDate}
            </p>

            <p>
              <strong>Time:</strong>
              ${bookingTime}
            </p>

            <p>
              <strong>Amount:</strong>
              ₹${amount}
            </p>

            <p>
              <strong>
                UTR / Transaction ID:
              </strong>
              ${utr || "Not available"}
            </p>

            <p>
              <strong>Booking ID:</strong>
              ${bookingId}
            </p>

          </div>

          <p>
            Your booking has been confirmed.
            Further details regarding the Pandit Ji
            assignment will be shared with you.
          </p>

          <p style="
            margin-top: 30px;
            font-weight: bold;
            color: #9a3412;
          ">
            🙏 Jai Shri Ganesh
          </p>

        </div>

        <div style="
          border-top: 1px solid #e5e7eb;
          padding-top: 15px;
          font-size: 12px;
          color: #777;
          text-align: center;
        ">
          PujaBooking<br />
          Traditional Vedic Puja Services
        </div>

      </div>
    `,
  });
};

// ==========================================
// 3. ADMIN - NEW BOOKING NOTIFICATION
// ==========================================

const sendAdminNewBookingEmail = async ({
  bookingId,
  pujaName,
  bookingDate,
  bookingTime,
  amount,
  customerName,
  customerMobile,
  customerEmail,
  city,
  locationType,
  address,
}) => {
  if (!ADMIN_EMAIL) {
    console.error(
      "❌ ADMIN_EMAIL is missing from .env"
    );

    return {
      success: false,
      error:
        "ADMIN_EMAIL is missing from .env",
    };
  }

  return sendEmail({
    to: ADMIN_EMAIL,

    subject:
      "🔔 PujaBooking – New Booking Received",

    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 650px;
        margin: 0 auto;
        padding: 30px;
        color: #333;
      ">

        <div style="
          background: #fff7ed;
          padding: 22px;
          border-radius: 12px;
          text-align: center;
        ">

          <h1 style="
            color: #c2410c;
            margin: 0;
          ">
            🔔 New Puja Booking
          </h1>

          <p style="
            color: #7c2d12;
          ">
            PujaBooking Admin Notification
          </p>

        </div>

        <div style="
          padding: 20px 5px;
        ">

          <h2 style="
            color: #9a3412;
          ">
            New Booking Received
          </h2>

          <div style="
            background: #fff7ed;
            border: 1px solid #fed7aa;
            border-radius: 10px;
            padding: 18px;
            margin: 15px 0;
          ">

            <h3>
              🪔 Puja Details
            </h3>

            <p>
              <strong>Puja:</strong>
              ${pujaName}
            </p>

            <p>
              <strong>Date:</strong>
              ${bookingDate}
            </p>

            <p>
              <strong>Time:</strong>
              ${bookingTime}
            </p>

            <p>
              <strong>Amount:</strong>
              ₹${amount}
            </p>

            <p>
              <strong>Booking ID:</strong>
              ${bookingId}
            </p>

          </div>

          <div style="
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 18px;
            margin: 15px 0;
          ">

            <h3>
              👤 Yajman Details
            </h3>

            <p>
              <strong>Name:</strong>
              ${customerName}
            </p>

            <p>
              <strong>Mobile:</strong>
              ${customerMobile}
            </p>

            <p>
              <strong>Email:</strong>
              ${customerEmail}
            </p>

            <p>
              <strong>City:</strong>
              ${city}
            </p>

            <p>
              <strong>Location:</strong>
              ${locationType}
            </p>

            ${
              address
                ? `
                  <p>
                    <strong>Address:</strong>
                    ${address}
                  </p>
                `
                : ""
            }

          </div>

          <div style="
            background: #fef3c7;
            border: 1px solid #fde68a;
            border-radius: 10px;
            padding: 15px;
            margin-top: 20px;
          ">

            <strong>
              ⚠️ Action Required
            </strong>

            <p>
              Please open the PujaBooking Admin
              Dashboard to review the booking and
              verify payment.
            </p>

          </div>

        </div>

        <div style="
          border-top: 1px solid #e5e7eb;
          padding-top: 15px;
          font-size: 12px;
          color: #777;
          text-align: center;
        ">

          PujaBooking<br />
          Admin Notification

        </div>

      </div>
    `,
  });
};

// ==========================================
// 4. ADMIN - PAYMENT SUBMITTED
// ==========================================

const sendAdminPaymentSubmittedEmail = async ({
  bookingId,
  pujaName,
  bookingDate,
  bookingTime,
  amount,
  customerName,
  customerMobile,
  customerEmail,
  utr,
}) => {
  if (!ADMIN_EMAIL) {
    console.error(
      "❌ ADMIN_EMAIL is missing from .env"
    );

    return {
      success: false,
      error:
        "ADMIN_EMAIL is missing from .env",
    };
  }

  return sendEmail({
    to: ADMIN_EMAIL,

    subject:
      "💰 PujaBooking – Payment Submitted",

    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 650px;
        margin: 0 auto;
        padding: 30px;
        color: #333;
      ">

        <div style="
          background: #ecfdf5;
          padding: 22px;
          border-radius: 12px;
          text-align: center;
        ">

          <h1 style="
            color: #15803d;
            margin: 0;
          ">
            💰 Payment Submitted
          </h1>

          <p>
            PujaBooking Admin Notification
          </p>

        </div>

        <div style="
          padding: 20px 5px;
        ">

          <h2 style="
            color: #166534;
          ">
            New Payment Details Submitted
          </h2>

          <div style="
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 10px;
            padding: 18px;
          ">

            <p>
              <strong>Puja:</strong>
              ${pujaName}
            </p>

            <p>
              <strong>Date:</strong>
              ${bookingDate}
            </p>

            <p>
              <strong>Time:</strong>
              ${bookingTime}
            </p>

            <p>
              <strong>Amount:</strong>
              ₹${amount}
            </p>

            <p>
              <strong>UTR:</strong>
              ${utr}
            </p>

            <p>
              <strong>Booking ID:</strong>
              ${bookingId}
            </p>

          </div>

          <div style="
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 18px;
            margin-top: 15px;
          ">

            <h3>
              👤 Yajman
            </h3>

            <p>
              <strong>Name:</strong>
              ${customerName}
            </p>

            <p>
              <strong>Mobile:</strong>
              ${customerMobile}
            </p>

            <p>
              <strong>Email:</strong>
              ${customerEmail}
            </p>

          </div>

          <div style="
            background: #fef3c7;
            border: 1px solid #fde68a;
            border-radius: 10px;
            padding: 15px;
            margin-top: 20px;
          ">

            <strong>
              ⚠️ Payment Verification Required
            </strong>

            <p>
              Please verify this payment from the
              Admin Dashboard.
            </p>

          </div>

        </div>

      </div>
    `,
  });
};

// ==========================================
// 5. ADMIN - PAYMENT VERIFIED
// ==========================================

const sendAdminPaymentVerifiedEmail = async ({
  bookingId,
  pujaName,
  bookingDate,
  bookingTime,
  amount,
  customerName,
  customerEmail,
  utr,
}) => {
  if (!ADMIN_EMAIL) {
    console.error(
      "❌ ADMIN_EMAIL is missing from .env"
    );

    return {
      success: false,
      error:
        "ADMIN_EMAIL is missing from .env",
    };
  }

  return sendEmail({
    to: ADMIN_EMAIL,

    subject:
      "✅ PujaBooking – Payment Verified",

    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 650px;
        margin: 0 auto;
        padding: 30px;
        color: #333;
      ">

        <div style="
          background: #f0fdf4;
          padding: 22px;
          border-radius: 12px;
          text-align: center;
        ">

          <h1 style="
            color: #15803d;
            margin: 0;
          ">
            ✅ Payment Verified
          </h1>

        </div>

        <div style="
          padding: 20px 5px;
        ">

          <h2>
            Booking Confirmed
          </h2>

          <p>
            Payment has been successfully verified
            from the PujaBooking Admin Dashboard.
          </p>

          <div style="
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 10px;
            padding: 18px;
          ">

            <p>
              <strong>Puja:</strong>
              ${pujaName}
            </p>

            <p>
              <strong>Date:</strong>
              ${bookingDate}
            </p>

            <p>
              <strong>Time:</strong>
              ${bookingTime}
            </p>

            <p>
              <strong>Amount:</strong>
              ₹${amount}
            </p>

            <p>
              <strong>UTR:</strong>
              ${utr || "Not available"}
            </p>

            <p>
              <strong>Yajman:</strong>
              ${customerName}
            </p>

            <p>
              <strong>Email:</strong>
              ${customerEmail}
            </p>

            <p>
              <strong>Booking ID:</strong>
              ${bookingId}
            </p>

          </div>

        </div>

      </div>
    `,
  });
};

// ==========================================
// 6. ADMIN - BOOKING CANCELLED
// ==========================================

const sendAdminBookingCancelledEmail = async ({
  bookingId,
  pujaName,
  bookingDate,
  bookingTime,
  amount,
  customerName,
  customerEmail,
  reason,
}) => {
  if (!ADMIN_EMAIL) {
    console.error(
      "❌ ADMIN_EMAIL is missing from .env"
    );

    return {
      success: false,
      error:
        "ADMIN_EMAIL is missing from .env",
    };
  }

  return sendEmail({
    to: ADMIN_EMAIL,

    subject:
      "⚠️ PujaBooking – Booking Cancelled",

    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 650px;
        margin: 0 auto;
        padding: 30px;
        color: #333;
      ">

        <div style="
          background: #fef2f2;
          padding: 22px;
          border-radius: 12px;
          text-align: center;
        ">

          <h1 style="
            color: #b91c1c;
            margin: 0;
          ">
            ⚠️ Booking Cancelled
          </h1>

        </div>

        <div style="
          padding: 20px 5px;
        ">

          <div style="
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 10px;
            padding: 18px;
          ">

            <p>
              <strong>Puja:</strong>
              ${pujaName}
            </p>

            <p>
              <strong>Date:</strong>
              ${bookingDate}
            </p>

            <p>
              <strong>Time:</strong>
              ${bookingTime}
            </p>

            <p>
              <strong>Amount:</strong>
              ₹${amount}
            </p>

            <p>
              <strong>Yajman:</strong>
              ${customerName}
            </p>

            <p>
              <strong>Email:</strong>
              ${customerEmail}
            </p>

            <p>
              <strong>Booking ID:</strong>
              ${bookingId}
            </p>

            ${
              reason
                ? `
                  <p>
                    <strong>Reason:</strong>
                    ${reason}
                  </p>
                `
                : ""
            }

          </div>

        </div>

      </div>
    `,
  });
};

// ==========================================
// 7. ADMIN - PANDIT ASSIGNED
// ==========================================

const sendAdminPanditAssignedEmail = async ({
  bookingId,
  pujaName,
  bookingDate,
  bookingTime,
  customerName,
  customerEmail,
  panditName,
  panditEmail,
}) => {
  if (!ADMIN_EMAIL) {
    console.error(
      "❌ ADMIN_EMAIL is missing from .env"
    );

    return {
      success: false,
      error:
        "ADMIN_EMAIL is missing from .env",
    };
  }

  return sendEmail({
    to: ADMIN_EMAIL,

    subject:
      "🪔 PujaBooking – Pandit Assigned",

    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 650px;
        margin: 0 auto;
        padding: 30px;
        color: #333;
      ">

        <div style="
          background: #fff7ed;
          padding: 22px;
          border-radius: 12px;
          text-align: center;
        ">

          <h1 style="
            color: #c2410c;
            margin: 0;
          ">
            🪔 Pandit Assigned
          </h1>

        </div>

        <div style="
          padding: 20px 5px;
        ">

          <div style="
            background: #fff7ed;
            border: 1px solid #fed7aa;
            border-radius: 10px;
            padding: 18px;
          ">

            <p>
              <strong>Puja:</strong>
              ${pujaName}
            </p>

            <p>
              <strong>Date:</strong>
              ${bookingDate}
            </p>

            <p>
              <strong>Time:</strong>
              ${bookingTime}
            </p>

            <p>
              <strong>Yajman:</strong>
              ${customerName}
            </p>

            <p>
              <strong>Customer Email:</strong>
              ${customerEmail}
            </p>

            <p>
              <strong>Pandit:</strong>
              ${panditName}
            </p>

            <p>
              <strong>Pandit Email:</strong>
              ${panditEmail}
            </p>

            <p>
              <strong>Booking ID:</strong>
              ${bookingId}
            </p>

          </div>

        </div>

      </div>
    `,
  });
};

// ==========================================
// 8. ADMIN - BOOKING COMPLETED
// ==========================================

const sendAdminBookingCompletedEmail = async ({
  bookingId,
  pujaName,
  bookingDate,
  bookingTime,
  customerName,
  customerEmail,
  panditName,
}) => {
  if (!ADMIN_EMAIL) {
    console.error(
      "❌ ADMIN_EMAIL is missing from .env"
    );

    return {
      success: false,
      error:
        "ADMIN_EMAIL is missing from .env",
    };
  }

  return sendEmail({
    to: ADMIN_EMAIL,

    subject:
      "🙏 PujaBooking – Puja Completed",

    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 650px;
        margin: 0 auto;
        padding: 30px;
        color: #333;
      ">

        <div style="
          background: #f0fdf4;
          padding: 22px;
          border-radius: 12px;
          text-align: center;
        ">

          <h1 style="
            color: #15803d;
            margin: 0;
          ">
            🙏 Puja Completed
          </h1>

        </div>

        <div style="
          padding: 20px 5px;
        ">

          <p>
            The assigned Pandit has marked this Puja
            booking as completed.
          </p>

          <div style="
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 10px;
            padding: 18px;
          ">

            <p>
              <strong>Puja:</strong>
              ${pujaName}
            </p>

            <p>
              <strong>Date:</strong>
              ${bookingDate}
            </p>

            <p>
              <strong>Time:</strong>
              ${bookingTime}
            </p>

            <p>
              <strong>Yajman:</strong>
              ${customerName}
            </p>

            <p>
              <strong>Customer Email:</strong>
              ${customerEmail}
            </p>

            <p>
              <strong>Pandit:</strong>
              ${panditName}
            </p>

            <p>
              <strong>Booking ID:</strong>
              ${bookingId}
            </p>

          </div>

        </div>

      </div>
    `,
  });
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  sendBookingEmail,
  sendPaymentVerifiedEmail,

  sendAdminNewBookingEmail,
  sendAdminPaymentSubmittedEmail,
  sendAdminPaymentVerifiedEmail,
  sendAdminBookingCancelledEmail,
  sendAdminPanditAssignedEmail,
  sendAdminBookingCompletedEmail,
};