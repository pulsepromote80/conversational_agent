


import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { language, agentId } = await request.json();
    
    // Use language-specific agent ID or fallback to default
    const finalAgentId = agentId || process.env.ELEVENLABS_AGENT_ID;
    const apiKey = process.env.ELEVENLABS_API_KEY;


    // Validation Check
    if (!finalAgentId || !apiKey) {
      console.error('Missing env variables:', { 
        hasAgentId: !!finalAgentId, 
        hasApiKey: !!apiKey 
      });
      return NextResponse.json(
        { error: 'Missing ELEVENLABS_AGENT_ID or API_KEY in environment variables' },
        { status: 500 }
      );
    }

    // Correct API Call to ElevenLabs with language-specific agent
    const url = `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${finalAgentId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API Error:', response.status, errorText);
      
      return NextResponse.json(
        { error: `ElevenLabs Error (${response.status}): ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({ 
      signedUrl: data.signed_url,
      language: language 
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}

// Also support GET for backward compatibility
export async function GET() {
  try {
    const agentId = process.env.ELEVENLABS_AGENT_ID;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!agentId || !apiKey) {
      return NextResponse.json(
        { error: 'Missing ELEVENLABS_AGENT_ID or API_KEY in environment variables' },
        { status: 500 }
      );
    }

    const url = `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `ElevenLabs Error (${response.status}): ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({ 
      signedUrl: data.signed_url 
    });
    
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}


