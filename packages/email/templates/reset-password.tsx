import type { TPasswordChangeSource } from '@documenso/lib/jobs/definitions/emails/send-password-reset-success-email';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';

import { Body, Container, Head, Hr, Html, Img, Link, Preview, Section, Text } from '../components';
import { useBranding } from '../providers/branding';
import { TemplateFooter } from '../template-components/template-footer';
import type { TemplateResetPasswordProps } from '../template-components/template-reset-password';
import { TemplateResetPassword } from '../template-components/template-reset-password';

export type ResetPasswordTemplateProps = Partial<TemplateResetPasswordProps> & {
  source?: TPasswordChangeSource;
};

export const ResetPasswordTemplate = ({
  userName = 'Lucas Smith',
  userEmail = 'lucas@0xmetalabs.com',
  assetBaseUrl = 'http://localhost:3002',
  source = 'RESET',
}: ResetPasswordTemplateProps) => {
  const { _ } = useLingui();
  const branding = useBranding();

  const previewText = source === 'RESET' ? msg`Password Reset Successful` : msg`Your password was changed`;

  const getAssetUrl = (path: string) => {
    return new URL(path, assetBaseUrl).toString();
  };

  return (
    <Html>
      <Head />
      <Preview>{_(previewText)}</Preview>

      <Body className="mx-auto my-auto bg-white font-sans">
        <Section>
          <Container className="mx-auto mt-8 mb-2 max-w-xl rounded-lg border border-slate-200 border-solid p-4 backdrop-blur-sm">
            <Section>
              {branding.brandingEnabled && branding.brandingLogo ? (
                <Img src={branding.brandingLogo} alt="Branding Logo" className="mb-4 h-6" />
              ) : (
                <Img
                  src={getAssetUrl('/static/logo.png')}
                  alt="0xMetaLabs Logo"
                  className="mb-4 h-6"
                />
              )}

              <TemplateResetPassword userName={userName} userEmail={userEmail} assetBaseUrl={assetBaseUrl} />
            </Section>
          </Container>

          <Container className="mx-auto mt-12 max-w-xl">
            <Section>
              <Text className="my-4 font-semibold text-base">
                <Trans>
                  Hi, {userName}{' '}
                  <Link className="font-normal text-slate-400" href={`mailto:${userEmail}`}>
                    ({userEmail})
                  </Link>
                </Trans>
              </Text>

              {source === 'RESET' ? (
                <>
                  <Text className="mt-2 text-base text-muted-foreground">
                    <Trans>We've changed your password as you asked. You can now sign in with your new password.</Trans>
                  </Text>
                  <Text className="mt-2 text-base text-muted-foreground">
                    <Trans>
                      Didn't request a password change? We are here to help you secure your account, just{' '}
                      <Link className="font-normal text-primary" href="mailto:hi@0xmetalabs.com">
                        contact us
                      </Link>
                      .
                    </Trans>
                  </Text>
                </>
              ) : (
                <>
                  <Text className="mt-2 text-base text-muted-foreground">
                    <Trans>Your password was just changed from your account security settings.</Trans>
                  </Text>
                  <Text className="mt-2 text-base text-muted-foreground">
                    <Trans>
                      If this was you, no action is needed. If it wasn't, reset your password immediately and{' '}
                      <Link className="font-normal text-primary" href="mailto:hi@0xmetalabs.com">
                        contact us
                      </Link>
                      .
                    </Trans>
                  </Text>
                </>
              )}
            </Section>
          </Container>

          <Hr className="mx-auto mt-12 max-w-xl" />

          <Container className="mx-auto max-w-xl">
            <TemplateFooter isDocument={false} />
          </Container>
        </Section>
      </Body>
    </Html>
  );
};

export default ResetPasswordTemplate;
