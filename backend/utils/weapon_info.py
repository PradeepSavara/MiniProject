import os
import google.generativeai as genai
import logging
from typing import Dict, Optional
import json
from dotenv import load_dotenv
import time
from datetime import datetime, timedelta

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set")

genai.configure(api_key=GEMINI_API_KEY)

# Initialize the model
try:
    # Use gemini-1.5-pro model which supports text generation
    model = genai.GenerativeModel('gemini-1.5-pro')
    logger.info("Successfully initialized Gemini model: gemini-1.5-pro")
except Exception as e:
    logger.error(f"Error initializing Gemini model: {str(e)}")
    raise

class WeaponInfo:
    """Class to handle weapon information retrieval using Gemini API"""
    
    # Rate limiting configuration
    RATE_LIMIT_WINDOW = 60  # seconds
    MAX_REQUESTS_PER_WINDOW = 3
    _request_timestamps = []
    
    @staticmethod
    def _check_rate_limit():
        """Check if we're within rate limits and wait if necessary"""
        now = datetime.now()
        # Remove timestamps older than the window
        WeaponInfo._request_timestamps = [
            ts for ts in WeaponInfo._request_timestamps
            if now - ts < timedelta(seconds=WeaponInfo.RATE_LIMIT_WINDOW)
        ]
        
        if len(WeaponInfo._request_timestamps) >= WeaponInfo.MAX_REQUESTS_PER_WINDOW:
            # Calculate wait time
            oldest_request = WeaponInfo._request_timestamps[0]
            wait_time = (oldest_request + timedelta(seconds=WeaponInfo.RATE_LIMIT_WINDOW) - now).total_seconds()
            if wait_time > 0:
                logger.info(f"Rate limit reached. Waiting {wait_time:.1f} seconds...")
                time.sleep(wait_time)
                # Clear timestamps after waiting
                WeaponInfo._request_timestamps = []
    
    @staticmethod
    def _record_request():
        """Record a new API request timestamp"""
        WeaponInfo._request_timestamps.append(datetime.now())
    
    # Fallback weapon database for when API is not available
    FALLBACK_DATABASE = {
        'knife': {
            'name': 'Knife',
            'type': 'Edged Weapon',
            'description': 'A bladed weapon used for cutting or stabbing. Can cause severe injuries or fatalities.',
            'specifications': {
                'model': 'Various',
                'caliber_or_size': 'Varies by type',
                'effective_range': 'Close range',
                'weight': 'Varies by type',
                'manufacturer': 'Various manufacturers'
            },
            'risk_factor': 'high',
            'prevention_measures': [
                'Install metal detectors',
                'Implement strict security checks',
                'Train security personnel in knife detection'
            ]
        },
        'gun': {
            'name': 'Firearm',
            'type': 'Ranged Weapon',
            'description': 'A ranged weapon that uses explosive propellant to launch projectiles. Can cause multiple casualties.',
            'specifications': {
                'model': 'Various',
                'caliber_or_size': 'Varies by type',
                'effective_range': 'Varies by type',
                'weight': 'Varies by type',
                'manufacturer': 'Various manufacturers'
            },
            'risk_factor': 'critical',
            'prevention_measures': [
                'Install weapon detection systems',
                'Implement strict access control',
                'Train security personnel in firearm detection'
            ]
        }
    }
    
    def __init__(self):
        self.model = model

    def _parse_gemini_response(self, response_text):
        """Parse Gemini response text into JSON format"""
        try:
            # Try to find JSON content in the response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx != -1 and end_idx != 0:
                json_str = response_text[start_idx:end_idx]
                return json.loads(json_str)
            return None
        except Exception as e:
            logger.error(f"Error parsing Gemini response: {str(e)}")
            return None

    def get_weapon_info(self, weapon_name):
        """Get detailed information about a weapon using Gemini AI"""
        try:
            # Check rate limit before making request
            self._check_rate_limit()
            self._record_request()

            prompt = f"""Analyze this weapon and provide information in the following JSON format:
            {{
                "name": "{weapon_name}",
                "type": "weapon type",
                "description": "detailed description",
                "specifications": {{
                    "model": "specific model if known",
                    "caliber_or_size": "caliber or size information",
                    "effective_range": "effective range",
                    "weight": "weight information",
                    "manufacturer": "manufacturer if known"
                }},
                "risk_factor": "low/medium/high",
                "prevention_measures": ["list of prevention measures"]
            }}

            Provide accurate and detailed information about {weapon_name}. Return ONLY the JSON object, no additional text."""

            response = self.model.generate_content(prompt)
            response.resolve()
            
            # Parse the response
            weapon_data = self._parse_gemini_response(response.text)
            
            if weapon_data:
                return weapon_data
            
            # If parsing failed, use fallback data
            logger.warning(f"Using fallback data for weapon: {weapon_name}")
            return self.FALLBACK_DATABASE.get(weapon_name.lower(), {
                "name": weapon_name,
                "type": "unknown",
                "description": "No information available",
                "specifications": {},
                "risk_factor": "unknown",
                "prevention_measures": []
            })

        except Exception as e:
            logger.error(f"Error getting weapon info: {str(e)}")
            return self.FALLBACK_DATABASE.get(weapon_name.lower(), {
                "name": weapon_name,
                "type": "unknown",
                "description": "Error retrieving information",
                "specifications": {},
                "risk_factor": "unknown",
                "prevention_measures": []
            })

    def get_risk_assessment(self, weapon_name, confidence=None):
        """Get risk assessment for a weapon using Gemini AI"""
        try:
            # Check rate limit before making request
            self._check_rate_limit()
            self._record_request()

            confidence_str = f" with {confidence:.2f} confidence" if confidence else ""
            prompt = f"""Analyze the risk of {weapon_name}{confidence_str} and provide assessment in the following JSON format:
            {{
                "risk_level": "low/medium/high",
                "risk_factors": ["list of risk factors"],
                "recommended_actions": ["list of recommended actions"],
                "safety_measures": ["list of safety measures"],
                "emergency_procedures": ["list of emergency procedures"]
            }}

            Provide a comprehensive risk assessment. Return ONLY the JSON object, no additional text."""

            response = self.model.generate_content(prompt)
            response.resolve()
            
            # Parse the response
            risk_data = self._parse_gemini_response(response.text)
            
            if risk_data:
                return risk_data
            
            # If parsing failed, use fallback data
            logger.warning(f"Using fallback risk assessment for weapon: {weapon_name}")
            fallback_data = {
                'knife': {
                    'risk_level': 'high',
                    'risk_factors': [
                        'Close-range weapon',
                        'Can cause severe injuries',
                        'Difficult to detect',
                        'Easy to conceal'
                    ],
                    'recommended_actions': [
                        'Maintain safe distance',
                        'Alert authorities',
                        'Evacuate if possible'
                    ],
                    'safety_measures': [
                        'Install metal detectors',
                        'Train security personnel',
                        'Implement strict security checks'
                    ],
                    'emergency_procedures': [
                        'Call emergency services',
                        'Secure the area',
                        'Provide first aid if safe'
                    ]
                },
                'gun': {
                    'risk_level': 'critical',
                    'risk_factors': [
                        'Long-range weapon',
                        'Multiple casualties possible',
                        'High lethality',
                        'Rapid fire capability'
                    ],
                    'recommended_actions': [
                        'Seek immediate cover',
                        'Call emergency services',
                        'Do not approach the weapon'
                    ],
                    'safety_measures': [
                        'Install weapon detection systems',
                        'Implement strict access control',
                        'Regular security training'
                    ],
                    'emergency_procedures': [
                        'Call emergency services',
                        'Lock down the area',
                        'Follow evacuation procedures'
                    ]
                }
            }
            
            return fallback_data.get(weapon_name.lower(), {
                'risk_level': 'unknown',
                'risk_factors': ['Unknown risk factors'],
                'recommended_actions': ['Unknown recommended actions'],
                'safety_measures': ['Unknown safety measures'],
                'emergency_procedures': ['Unknown emergency procedures']
            })

        except Exception as e:
            logger.error(f"Error getting risk assessment: {str(e)}")
            return {
                'risk_level': 'unknown',
                'risk_factors': ['Error retrieving risk factors'],
                'recommended_actions': ['Error retrieving recommended actions'],
                'safety_measures': ['Error retrieving safety measures'],
                'emergency_procedures': ['Error retrieving emergency procedures']
            } 