'use client';
import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Stack,
  Typography,
  CircularProgress, // 👈 added
} from '@mui/material';
import {
  EmailIcon,
  InstaIcon,
  LinkedInWebIcon,
  LocationIcon,
  PhoneIcon,
} from '../../../public/images';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import bookACallSchema from '../../validationSchema/bookACall/bookACall.schema';
import CustomTextField from '../../common/CustomTextField';
import CustomFullDatePicker from '../../common/CustomFullDatePicker';
import CustomTimeSelect from '../../common/CustomTimeSelect';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { HomeManager } from '../../services/home/api';
import { showToast } from '@/hooks/showToast';
import { SOCIAL_LINKS } from '@/config/site';
import CustomPhoneInputField from '@/common/CustomPhoneInputField';
import CustomTimezoneSelect from '@/common/CustomTimezoneSelect';
import Link from 'next/link';
import ContactPhones from '@/components/common/ContactPhones';

dayjs.extend(utc);
dayjs.extend(timezone);

const BookSection = () => {
  const [loading, setLoading] = useState(false); // 👈 added loader state

  const {
    control,
    handleSubmit,
    setValue,
    reset, // 👈 imported reset from useForm
    formState: { errors },
  } = useForm({
    resolver: yupResolver(bookACallSchema),
    defaultValues: {
      name: '',
      phone: '',
      timezone: '',
      preferredDate: '',
      preferredTime: '',
      message: '',
    },
  });

  // Auto-adjust preferred date/time whenever timezone changes
  const selectedTimezone = useWatch({ control, name: 'timezone' });
  useEffect(() => {
    if (!selectedTimezone) return;
    const nowTz = dayjs().tz(selectedTimezone);
    // Set preferred date to today in the selected timezone
    setValue('preferredDate', nowTz.toDate(), { shouldValidate: true, shouldDirty: true });
    // Compute next 30-minute slot
    const minutes = nowTz.hour() * 60 + nowTz.minute();
    const next = Math.ceil((minutes + 1) / 30) * 30; // round up
    const hh = String(Math.floor(next / 60) % 24).padStart(2, '0');
    const mm = String(next % 60).padStart(2, '0');
    setValue('preferredTime', `${hh}:${mm}`, { shouldValidate: true, shouldDirty: true });
  }, [selectedTimezone, setValue]);

  const onSubmit = async (data) => {
    setLoading(true); // 👈 start loader
    try {
      // Build a timezone-aware datetime
      const tz = data.timezone; // e.g., 'Asia/Kolkata'
      const hasDate = Boolean(data.preferredDate);
      const hasTime = Boolean(data.preferredTime);

      let preferredDatetimeUtc = '';
      let timezoneOffsetLabel = '';

      if (hasDate && hasTime && tz) {
        const [hh, mm] = data.preferredTime.split(':');
        const local = dayjs(data.preferredDate)
          .hour(parseInt(hh, 10))
          .minute(parseInt(mm, 10))
          .second(0)
          .millisecond(0)
          .tz(tz);

        preferredDatetimeUtc = local.utc().format(); // ISO in Z

        const offsetMin = dayjs().tz(tz).utcOffset();
        const sign = offsetMin >= 0 ? '+' : '-';
        const abs = Math.abs(offsetMin);
        const oh = String(Math.floor(abs / 60)).padStart(2, '0');
        const om = String(abs % 60).padStart(2, '0');
        timezoneOffsetLabel = `UTC${sign}${oh}:${om}`;
      }

      const payload = {
        name: data.name,
        mobile: data.phone,
        preferred_datetime: preferredDatetimeUtc,
        timezone: timezoneOffsetLabel,
        query: data.message,
      };

      const { variant, message } = await HomeManager.bookCall(payload);
      showToast(message, variant);

      if (variant === 'success') {
        reset();
      }
    } catch (err) {
      console.error(err);
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ backgroundColor: 'customBlue.secondary', pt: { xs: '6rem', lg: '6.5rem' } }}>
      <Container sx={{ py: { xs: 4, md: '6.25rem' } }}>
        <Grid container spacing={{ xs: 4 }} justifyContent={'space-between'}>
          {/* LEFT SECTION */}
          <Grid
            item
            xs={12}
            sm={6}
            md={6}
            sx={{
              display: 'flex',
              justifyContent: { xs: 'center', md: 'flex-end' },
              alignItems: 'stretch',
            }}
          >
            <Stack spacing={3} sx={{ height: '100%' }}>
              <Typography
                component={'h1'}
                variant="h1_light"
                sx={{
                  fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3.75rem' },
                  lineHeight: 'normal',
                  color: 'text',
                  maxWidth: 560,
                }}
              >
                Ready to Get Surely Placed?
              </Typography>
              <Typography
                sx={{
                  color: 'text.subText',
                  fontSize: { xs: '0.875rem', md: '1rem' },
                  maxWidth: 560,
                }}
              >
                You’ve got the drive, now get the direction. Book a free call with our team to
                explore how our programs, analytics, and application support can help you move from
                rejections to results and land offers that fit your goals.
              </Typography>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <EmailIcon />
                  <Typography sx={{ color: 'text.subText' }}>marketing@surelyplaced.com</Typography>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                  <PhoneIcon />
                  <ContactPhones variant="body1" />
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <LocationIcon />
                  <Typography sx={{ color: 'text.subText' }}>
                    Capital Icon, Sargasan, Gandhinagar, Gujarat 382421.
                  </Typography>
                </Stack>
                <Box display={'flex'} alignItems={'center'} gap={1}>
                  <Link
                    href={SOCIAL_LINKS.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <InstaIcon />
                  </Link>
                  <Link
                    href={'https://www.linkedin.com/company/surely-placed/'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <LinkedInWebIcon />
                  </Link>
                </Box>
              </Stack>
            </Stack>
          </Grid>

          {/* RIGHT SECTION (FORM) */}
          <Grid item xs={12} sm={6} md={6}>
            <Box
              sx={{
                backgroundColor: 'extremes.light',
                borderRadius: '1.25rem',
                p: { xs: '1rem', sm: '2.5rem' },
                boxShadow: '0px 6px 24px rgba(0,0,0,0.06)',
                height: '100%',
                maxWidth: '700px',
                width: '100%',
                mx: { xs: 0, md: 'auto' },
              }}
            >
              <Typography
                component={'h2'}
                sx={{
                  fontWeight: 400,
                  fontSize: { xs: '1.125rem', sm: '1.25rem', md: '2rem' },
                  color: 'text.main',
                  mb: { xs: 2, md: 3 },
                }}
              >
                Let’s Plan Your Next Move 👋
              </Typography>

              <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Stack spacing={2.25}>
                  <CustomTextField
                    name="name"
                    control={control}
                    label="Name"
                    placeholder="John Doe"
                    fullWidth
                    error={errors.name}
                  />

                  <Box>
                    <CustomPhoneInputField
                      name="phone"
                      control={control}
                      label="Phone Number"
                      placeholder="Enter Phone Number"
                      type="text"
                      inputTextColor="#fff"
                      dd={true}
                      error={errors?.phone}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 0.75,
                        fontSize: '0.6875rem',
                        lineHeight: 1.4,
                        color: 'text.subText',
                      }}
                    >
                      By submitting, you consent to being contacted using the contact details
                      provided.
                    </Typography>
                  </Box>
                  <CustomTimezoneSelect
                    name="timezone"
                    control={control}
                    label="Timezone"
                    error={errors.timezone}
                  />
                  <Grid container spacing={2}>
                    <Grid item xs={7} sm={8}>
                      <CustomFullDatePicker
                        name="preferredDate"
                        control={control}
                        label="Preferred Date"
                        timezone={useWatch({ control, name: 'timezone' })}
                        error={errors.preferredDate}
                      />
                    </Grid>
                    <Grid item xs={5} sm={4}>
                      <CustomTimeSelect
                        name="preferredTime"
                        control={control}
                        label="Time"
                        selectedDate={useWatch({ control, name: 'preferredDate' })}
                        selectedTimezone={useWatch({ control, name: 'timezone' })}
                        error={errors.preferredTime}
                      />
                    </Grid>
                  </Grid>
                  <CustomTextField
                    name="message"
                    control={control}
                    label="What do you want to discuss?"
                    placeholder="Lets us know your query?"
                    multiline
                    fullWidth
                    error={errors.message}
                  />

                  <Button
                    type="submit"
                    variant="filled"
                    fullWidth
                    disabled={loading}
                    sx={{
                      mt: 1,
                      color: '#fff',
                      position: 'relative',
                      height: 48,
                    }}
                  >
                    {loading ? (
                      <CircularProgress
                        size={24}
                        sx={{
                          color: '#fff',
                        }}
                      />
                    ) : (
                      'Book a Call'
                    )}
                  </Button>
                </Stack>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default BookSection;
