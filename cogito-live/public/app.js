/**
 * Cogito Live Meeting Companion - Client App
 */

class CogitoLiveMeeting {
  constructor() {
    this.ws = null;
    this.mediaRecorder = null;
    this.stream = null;
    this.isRecording = false;
    this.connectionId = null;
    this.meetingId = null;
    
    // UI elements
    this.elements = {
      connectionStatus: document.getElementById('connection-status'),
      meetingStatus: document.getElementById('meeting-status'),
      participantName: document.getElementById('participant-name'),
      startButton: document.getElementById('start-meeting'),
      stopButton: document.getElementById('stop-meeting'),
      clearButton: document.getElementById('clear-transcript'),
      voiceButton: document.getElementById('toggle-voice'),
      transcript: document.getElementById('transcript'),
      insights: document.getElementById('insights'),
      audioLevel: document.getElementById('audio-level')
    };
    
    this.init();
  }
  
  async init() {
    console.log('🚀 Initializing Cogito Live Meeting Companion');
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Connect to WebSocket server
    await this.connect();
    
    // Check audio permissions
    await this.checkAudioPermissions();
  }
  
  setupEventListeners() {
    this.elements.startButton.addEventListener('click', () => this.startMeeting());
    this.elements.stopButton.addEventListener('click', () => this.stopMeeting());
    this.elements.clearButton.addEventListener('click', () => this.clearTranscript());
    this.elements.voiceButton.addEventListener('click', () => this.toggleVoice());
    
    // Auto-focus name input
    this.elements.participantName.focus();
  }
  
  async connect() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      
      console.log(`📡 Connecting to ${wsUrl}`);
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('✅ Connected to server');
        this.updateConnectionStatus(true);
      };
      
      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };
      
      this.ws.onclose = () => {
        console.log('🔌 Disconnected from server');
        this.updateConnectionStatus(false);
        
        // Try to reconnect after 3 seconds
        setTimeout(() => this.connect(), 3000);
      };
      
      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.updateConnectionStatus(false);
      };
      
    } catch (error) {
      console.error('❌ Connection failed:', error);
      this.updateConnectionStatus(false);
    }
  }
  
  handleMessage(message) {
    console.log('📨 Received:', message.type);
    
    switch (message.type) {
      case 'welcome':
        this.connectionId = message.connectionId;
        console.log(`🎯 Connection ID: ${this.connectionId}`);
        break;
        
      case 'meeting-started':
        this.meetingId = message.meetingId;
        this.updateMeetingStatus(`Meeting active: ${this.meetingId}`);
        this.elements.startButton.disabled = true;
        this.elements.stopButton.disabled = false;
        break;
        
      case 'transcription':
        this.addTranscriptEntry('Speaker', message.text, message.timestamp, message.roles);
        break;
        
      case 'insight':
        this.addInsight(message.insightType || message.type, message.text);
        break;
        
      case 'meeting-ended':
        this.updateMeetingStatus('Meeting ended');
        this.elements.startButton.disabled = false;
        this.elements.stopButton.disabled = true;
        break;
        
      case 'error':
        console.error('❌ Server error:', message.message);
        this.showError(message.message);
        break;
    }
  }
  
  async checkAudioPermissions() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      
      if (audioInputs.length === 0) {
        this.showError('No audio input devices found');
        return false;
      }
      
      console.log(`🎤 Found ${audioInputs.length} audio input device(s)`);
      return true;
      
    } catch (error) {
      console.error('❌ Error checking audio permissions:', error);
      this.showError('Unable to access audio devices');
      return false;
    }
  }
  
  async startMeeting() {
    try {
      console.log('🎤 Starting meeting...');
      
      // Get participant name
      const participantName = this.elements.participantName.value.trim() || 'Anonymous';
      
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      });
      
      // Set up audio level monitoring
      this.setupAudioLevelMonitoring();
      
      // Set up media recorder
      this.setupMediaRecorder();
      
      // Send start meeting message
      this.sendMessage({
        type: 'start-meeting',
        participantName: participantName
      });
      
      console.log('✅ Meeting started');
      
    } catch (error) {
      console.error('❌ Failed to start meeting:', error);
      this.showError('Failed to start meeting: ' + error.message);
    }
  }
  
  setupAudioLevelMonitoring() {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(this.stream);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    microphone.connect(analyser);
    analyser.fftSize = 256;
    
    const updateLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const level = (average / 255) * 100;
      
      // Update UI
      this.elements.audioLevel.style.width = `${level}%`;
      
      if (this.isRecording) {
        requestAnimationFrame(updateLevel);
      }
    };
    
    this.isRecording = true;
    updateLevel();
  }
  
  setupMediaRecorder() {
    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: 'audio/webm;codecs=opus'
    });
    
    let audioChunks = [];
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
        
        // Send audio chunk to server for transcription
        const reader = new FileReader();
        reader.onload = () => {
          this.sendMessage({
            type: 'audio-chunk',
            data: Array.from(new Uint8Array(reader.result)),
            timestamp: new Date().toISOString()
          });
        };
        reader.readAsArrayBuffer(event.data);
      }
    };
    
    this.mediaRecorder.onstop = () => {
      console.log('🛑 Recording stopped');
      audioChunks = [];
    };
    
    // Start recording with 1-second intervals
    this.mediaRecorder.start(1000);
  }
  
  stopMeeting() {
    console.log('🛑 Stopping meeting...');
    
    // Stop recording
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
    
    // Stop audio stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.isRecording = false;
    
    // Send end meeting message
    this.sendMessage({
      type: 'end-meeting'
    });
    
    // Reset audio level
    this.elements.audioLevel.style.width = '0%';
    
    console.log('✅ Meeting stopped');
  }
  
  clearTranscript() {
    this.elements.transcript.innerHTML = '<div class=\"transcript-placeholder\">Transcript cleared...</div>';
    this.elements.insights.innerHTML = '<div class=\"insights-placeholder\">Insights cleared...</div>';
  }
  
  toggleVoice() {
    // TODO: Implement voice toggle
    console.log('🔊 Voice toggle not implemented yet');
  }
  
  addTranscriptEntry(speaker, text, timestamp, roles = []) {
    // Remove placeholder if present
    const placeholder = this.elements.transcript.querySelector('.transcript-placeholder');
    if (placeholder) {
      placeholder.remove();
    }
    
    const entry = document.createElement('div');
    entry.className = 'transcript-entry';
    
    const time = new Date(timestamp).toLocaleTimeString();
    
    // Format roles if present
    let rolesHtml = '';
    if (roles && roles.length > 0) {
      const roleNames = roles.map(r => r.role).join(', ');
      rolesHtml = `<div class=\"transcript-roles\">🎭 ${roleNames}</div>`;
    }
    
    entry.innerHTML = `
      <div class=\"transcript-speaker\">${speaker}</div>
      <div class=\"transcript-text\">${text}</div>
      ${rolesHtml}
      <div class=\"transcript-time\">${time}</div>
    `;
    
    this.elements.transcript.appendChild(entry);
    this.elements.transcript.scrollTop = this.elements.transcript.scrollHeight;
  }
  
  addInsight(type, text) {
    // Remove placeholder if present
    const placeholder = this.elements.insights.querySelector('.insights-placeholder');
    if (placeholder) {
      placeholder.remove();
    }
    
    const insight = document.createElement('div');
    insight.className = 'insight-card';
    
    insight.innerHTML = `
      <div class=\"insight-type\">${type}</div>
      <div class=\"insight-text\">${text}</div>
    `;
    
    this.elements.insights.appendChild(insight);
    this.elements.insights.scrollTop = this.elements.insights.scrollHeight;
  }
  
  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket not connected');
    }
  }
  
  updateConnectionStatus(connected) {
    const status = this.elements.connectionStatus;
    if (connected) {
      status.textContent = '● Connected';
      status.className = 'status-indicator connected';
    } else {
      status.textContent = '● Disconnected';
      status.className = 'status-indicator disconnected';
    }
  }
  
  updateMeetingStatus(message) {
    this.elements.meetingStatus.textContent = message;
  }
  
  showError(message) {
    // TODO: Implement better error display
    alert('Error: ' + message);
  }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new CogitoLiveMeeting();
});