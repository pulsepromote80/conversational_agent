import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const agentId = process.env.ELEVENLABS_AGENT_ID;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    // Validation Check
    if (!agentId || !apiKey) {
      console.error('Missing env variables:', { 
        hasAgentId: !!agentId, 
        hasApiKey: !!apiKey 
      });
      return NextResponse.json(
        { error: 'Missing ELEVENLABS_AGENT_ID or API_KEY in environment variables' },
        { status: 500 }
      );
    }

    // Correct API Call to ElevenLabs
    const url = `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    // Error Handling
    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API Error:', response.status, errorText);
      
      return NextResponse.json(
        { error: `ElevenLabs Error (${response.status}): ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Return the signed URL
    return NextResponse.json({ 
      signedUrl: data.signed_url 
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}