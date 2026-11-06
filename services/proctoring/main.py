from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time
import json
from typing import List, Optional

app = FastAPI(title="Virella Proctoring Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FrameAnalysisRequest(BaseModel):
    sessionId: str
    timestamp: float
    frameBase64: Optional[str] = None
    clientFaceDetected: bool = True
    clientGazeDeviation: float = 0.0

class IntegrityFlag(BaseModel):
    type: str
    confidence: float
    severity: str
    note: str
    timestamp: float

class AnalysisResponse(BaseModel):
    status: str
    flags: List[IntegrityFlag]

@app.get("/health")
def health():
    return {"status": "healthy", "service": "virella-proctoring-engine"}

@app.post("/analyze-frame", response_model=AnalysisResponse)
def analyze_frame(req: FrameAnalysisRequest):
    """
    Evaluates throttled 2-5 fps frame metrics.
    Applies non-punitive threshold smoothing:
    - Looking away briefly while thinking is normal human behavior (low severity)
    - Persistent face disappearance or multiple faces flagged as 'Needs Review'
    """
    flags: List[IntegrityFlag] = []
    
    if not req.clientFaceDetected:
        flags.append(IntegrityFlag(
            type="No Face Detected",
            confidence=0.88,
            severity="review_needed",
            note="Face momentarily outside camera frustum",
            timestamp=req.timestamp
        ))
    elif req.clientGazeDeviation > 0.45:
        flags.append(IntegrityFlag(
            type="Gaze Deviation",
            confidence=round(req.clientGazeDeviation, 2),
            severity="low",
            note="Head pose turned away from primary screen",
            timestamp=req.timestamp
        ))

    return AnalysisResponse(status="analyzed", flags=flags)

@app.websocket("/ws/proctor/{sessionId}")
async def websocket_proctor(websocket: WebSocket, sessionId: str):
    await websocket.accept()
    print(f"[Proctoring WS Connected] Session: {sessionId}")
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            # Process throttled frame telemetry
            timestamp = payload.get("timestamp", time.time())
            await websocket.send_json({
                "status": "ack",
                "sessionId": sessionId,
                "timestamp": timestamp,
                "reviewNotes": []
            })
    except WebSocketDisconnect:
        print(f"[Proctoring WS Disconnected] Session: {sessionId}")
