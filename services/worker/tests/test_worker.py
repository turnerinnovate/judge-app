from services.worker.worker import Job, process_job


def test_recalculate_progress_metrics_improving():
    job = Job(
        id='1',
        organization_id='org1',
        type='RECALCULATE_PROGRESS_METRICS',
        status='QUEUED',
        payload={'latestScore': 8.2, 'previousScore': 7.6},
    )
    result = process_job(job)
    assert result.status == 'COMPLETED'
    assert result.result['trend'] == 'IMPROVING'
    assert result.result['delta'] == 0.6


def test_analysis_low_confidence_fails_with_rerecord_recommendation():
    job = Job(
        id='2',
        organization_id='org1',
        type='ANALYZE_STUDENT_SUBMISSION',
        status='QUEUED',
        payload={'quality': 0.4, 'confidence': 0.45},
    )
    result = process_job(job)
    assert result.status == 'FAILED'
    assert 'Re-record' in result.result['recommendedAction']


def test_render_visualization_returns_snapshot_metadata():
    job = Job(
        id='3',
        organization_id='org1',
        type='RENDER_VISUALIZATION',
        status='QUEUED',
        payload={'snapshotCount': 6},
    )
    result = process_job(job)
    assert result.status == 'COMPLETED'
    assert result.result['artifactType'] == 'KEYFRAME_SNAPSHOTS'
    assert result.result['count'] == 6


def test_unsupported_job_fails():
    job = Job(
        id='4',
        organization_id='org1',
        type='UNKNOWN_JOB',
        status='QUEUED',
        payload={},
    )
    result = process_job(job)
    assert result.status == 'FAILED'
    assert 'Unsupported job type' in result.error
