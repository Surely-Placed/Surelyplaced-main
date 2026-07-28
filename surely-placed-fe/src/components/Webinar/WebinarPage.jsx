'use client';

import React, { useCallback, useState } from 'react';
import { showToast } from '@/hooks/showToast';
import { usePayPalCheckout } from '@/hooks/usePayPalCheckout';
import { trackMetaEvent } from '@/components/seo/MetaPixel';
import { joinWebinarWaitlist } from '@/lib/payments';
import { EMPTY_WEBINAR_FORM, WEBINAR_PLAN_SLUG } from '../../../mockData/Webinar';
import { useExitIntent } from './hooks/useExitIntent';
import { useWebinarPublic } from './hooks/useWebinarPublic';
import { RegistrationDialog, validateRegistration } from './dialogs/RegistrationDialog';
import { SuccessDialog } from './dialogs/SuccessDialog';
import { ExitIntentDialog } from './dialogs/ExitIntentDialog';
import { WaitlistDialog } from './dialogs/WaitlistDialog';
import { HeroSection } from './sections/HeroSection';
import { ProblemSection } from './sections/ProblemSection';
import { YoutubeSection } from './sections/YoutubeSection';
import { WalkAwaySection } from './sections/WalkAwaySection';
import { PricingSection } from './sections/PricingSection';
import { InstructorSection } from './sections/InstructorSection';
import { TestimonialsSection } from './sections/TestimonialsSection';
import { FaqSection } from './sections/FaqSection';
import { FinalCtaSection } from './sections/FinalCtaSection';
import { MobileStickyCta } from './sections/MobileStickyCta';

const WebinarPage = ({
  price: priceProp,
  seatsLeft: seatsLeftProp,
  seatsTotal: seatsTotalProp,
  exitPopup = true,
  webinarDate: webinarDateProp,
  datetimeLabel: datetimeLabelProp,
  onLeadCapture,
}) => {
  const {
    price,
    priceLabel,
    seatsLeft,
    setSeatsLeft,
    seatsTotal,
    seatsProgress,
    datetimeLabel,
    webinarActive,
    countdown,
  } = useWebinarPublic({
    price: priceProp,
    seatsLeft: seatsLeftProp,
    seatsTotal: seatsTotalProp,
    webinarDate: webinarDateProp,
    datetimeLabel: datetimeLabelProp,
  });

  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_WEBINAR_FORM);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [exitName, setExitName] = useState('');
  const [exitEmail, setExitEmail] = useState('');
  const [exitSent, setExitSent] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyName, setNotifyName] = useState('');
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyPhone, setNotifyPhone] = useState('');
  const [notifyError, setNotifyError] = useState('');
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifySent, setNotifySent] = useState(false);

  const {
    startCheckout,
    loading: checkoutLoading,
    paymentStep,
    buttonsHostRef,
    resetPaymentStep,
    error: paypalError,
  } = usePayPalCheckout({
    onSuccess: () => {
      setRegistrationOpen(false);
      setSuccess(true);
      setSeatsLeft((n) => Math.max(0, Number(n) - 1));
      trackMetaEvent('Lead', { content_name: 'Webinar Registration' });
      trackMetaEvent('Purchase', {
        value: price,
        currency: 'USD',
        content_name: 'Live Career Webinar',
        content_ids: [WEBINAR_PLAN_SLUG],
      });
      showToast('Payment successful! Check your email for confirmation.', 'success');
    },
    onFailure: (err) => {
      if (err?.message === 'Checkout dismissed') {
        return;
      }
      setFormError(err?.message || 'Payment failed. Please try again.');
      showToast(err?.message || 'Payment failed. Please try again.', 'error');
    },
  });

  useExitIntent(
    exitPopup && !registrationOpen && !success,
    useCallback(() => setExitOpen(true), [])
  );

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const openCheckout = () => {
    if (!webinarActive) {
      setNotifyOpen(true);
      setNotifyError('');
      setNotifySent(false);
      return;
    }
    setRegistrationOpen(true);
    setFormError('');
    trackMetaEvent('InitiateCheckout', {
      value: price,
      currency: 'USD',
      content_name: 'Live Career Webinar',
    });
  };

  const submitNotify = async () => {
    if (!notifyName.trim()) {
      setNotifyError('Please enter your name.');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(notifyEmail.trim())) {
      setNotifyError('Please enter a valid email.');
      return;
    }
    setNotifyLoading(true);
    setNotifyError('');
    try {
      await joinWebinarWaitlist({
        name: notifyName.trim(),
        email: notifyEmail.trim(),
        contact: notifyPhone.trim() || undefined,
      });
      setNotifySent(true);
      onLeadCapture?.({ name: notifyName.trim(), email: notifyEmail.trim() });
      trackMetaEvent('Lead', { content_name: 'Webinar Waitlist' });
      showToast('You are on the waitlist. We will email you when seats open.', 'success');
    } catch (err) {
      setNotifyError(err?.message || 'Could not join waitlist. Please try again.');
    } finally {
      setNotifyLoading(false);
    }
  };

  const submitRegistration = async () => {
    const validationError = validateRegistration(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError('');
    try {
      await startCheckout({
        planSlug: WEBINAR_PLAN_SLUG,
        name: form.fullName.trim(),
        email: form.email.trim(),
        contact: form.phone.trim(),
        registration: {
          country: form.country,
          status: form.status,
          visa: form.visa,
          experience: form.exp,
        },
      });
    } catch (err) {
      setFormError(err?.message || 'Unable to start payment. Please try again.');
      showToast(err?.message || 'Unable to start payment.', 'error');
    }
  };

  const sendExit = () => {
    if (!exitName.trim() || !exitEmail.trim()) return;
    onLeadCapture?.({ name: exitName.trim(), email: exitEmail.trim() });
    setExitSent(true);
  };

  const sectionProps = {
    webinarActive,
    priceLabel,
    onReserve: openCheckout,
  };

  return (
    <>
      <HeroSection
        {...sectionProps}
        datetimeLabel={datetimeLabel}
        countdown={countdown}
        seatsLeft={seatsLeft}
        seatsTotal={seatsTotal}
        seatsProgress={seatsProgress}
      />
      <ProblemSection {...sectionProps} />
      <YoutubeSection />
      <WalkAwaySection {...sectionProps} />
      <PricingSection {...sectionProps} seatsLeft={seatsLeft} seatsTotal={seatsTotal} />
      <InstructorSection {...sectionProps} />
      <TestimonialsSection />
      <FaqSection />
      <FinalCtaSection {...sectionProps} />
      <MobileStickyCta
        webinarActive={webinarActive}
        datetimeLabel={datetimeLabel}
        seatsLeft={seatsLeft}
        priceLabel={priceLabel}
        onReserve={openCheckout}
      />

      <RegistrationDialog
        open={registrationOpen}
        onClose={() => {
          if (checkoutLoading) return;
          resetPaymentStep();
          setRegistrationOpen(false);
        }}
        form={form}
        onFieldChange={setField}
        formError={formError || paypalError}
        datetimeLabel={datetimeLabel}
        priceLabel={priceLabel}
        checkoutLoading={checkoutLoading}
        onSubmit={submitRegistration}
        paymentStep={paymentStep}
        buttonsHostRef={buttonsHostRef}
        onBackToForm={() => {
          resetPaymentStep();
          setFormError('');
        }}
      />
      <SuccessDialog
        open={success}
        onClose={() => setSuccess(false)}
        email={form.email}
        datetimeLabel={datetimeLabel}
      />
      <ExitIntentDialog
        open={exitOpen}
        onClose={() => setExitOpen(false)}
        name={exitName}
        email={exitEmail}
        onNameChange={(e) => setExitName(e.target.value)}
        onEmailChange={(e) => setExitEmail(e.target.value)}
        sent={exitSent}
        onSubmit={sendExit}
      />
      <WaitlistDialog
        open={notifyOpen}
        onClose={() => !notifyLoading && setNotifyOpen(false)}
        name={notifyName}
        email={notifyEmail}
        phone={notifyPhone}
        onNameChange={(e) => setNotifyName(e.target.value)}
        onEmailChange={(e) => setNotifyEmail(e.target.value)}
        onPhoneChange={(e) => setNotifyPhone(e.target.value)}
        error={notifyError}
        loading={notifyLoading}
        sent={notifySent}
        onSubmit={submitNotify}
      />
    </>
  );
};

export default WebinarPage;
