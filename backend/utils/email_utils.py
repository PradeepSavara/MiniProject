import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import logging
import ssl

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmailNotifier:
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', 587))
        self.sender_email = os.getenv('SENDER_EMAIL')
        self.sender_password = os.getenv('SENDER_PASSWORD')
        self.admin_email = os.getenv('ADMIN_EMAIL')
        
        if not all([self.sender_email, self.sender_password, self.admin_email]):
            logger.warning("Email configuration is incomplete. Email notifications will not work.")
            logger.warning("Please check your .env file and ensure all email settings are configured.")
    
    def send_weapon_alert(self, weapon_info, detection_source):
        """Send an email alert about a high-risk weapon detection"""
        try:
            if not all([self.sender_email, self.sender_password, self.admin_email]):
                logger.error("Email configuration is incomplete. Cannot send alert.")
                logger.error("Missing configuration: " + 
                           ", ".join([k for k, v in {
                               'SENDER_EMAIL': self.sender_email,
                               'SENDER_PASSWORD': self.sender_password,
                               'ADMIN_EMAIL': self.admin_email
                           }.items() if not v]))
                return False
            
            # Create message
            msg = MIMEMultipart()
            msg['From'] = self.sender_email
            msg['To'] = self.admin_email
            msg['Subject'] = f"High Risk Weapon Alert: {weapon_info['name']}"
            
            # Create email body
            body = f"""
            High Risk Weapon Detected!
            
            Weapon Details:
            - Name: {weapon_info['name']}
            - Type: {weapon_info['type']}
            - Description: {weapon_info['description']}
            - Risk Level: {weapon_info['risk_factor']}
            
            Detection Source: {detection_source}
            
            Specifications:
            - Model: {weapon_info['specifications'].get('model', 'Unknown')}
            - Caliber/Size: {weapon_info['specifications'].get('caliber_or_size', 'Unknown')}
            - Effective Range: {weapon_info['specifications'].get('effective_range', 'Unknown')}
            
            Prevention Measures:
            {chr(10).join(f'- {measure}' for measure in weapon_info['prevention_measures'])}
            
            Please take appropriate action immediately.
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Create SSL context
            context = ssl.create_default_context()
            
            # Send email with better error handling
            try:
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.ehlo()
                    server.starttls(context=context)
                    server.ehlo()
                    server.login(self.sender_email, self.sender_password)
                    server.send_message(msg)
                
                logger.info(f"Email alert sent successfully for weapon: {weapon_info['name']}")
                return True
                
            except smtplib.SMTPAuthenticationError as e:
                logger.error(f"SMTP Authentication Error: {str(e)}")
                logger.error("Please check your email credentials in the .env file.")
                logger.error("For Gmail, make sure you're using an App Password, not your regular password.")
                return False
                
            except smtplib.SMTPException as e:
                logger.error(f"SMTP Error: {str(e)}")
                return False
                
            except Exception as e:
                logger.error(f"Unexpected error while sending email: {str(e)}")
                return False
            
        except Exception as e:
            logger.error(f"Error preparing email alert: {str(e)}")
            return False 