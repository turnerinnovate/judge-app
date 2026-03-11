from services.worker.worker import Job, process_job


def test_score_tournament_uses_human_panel_average():
    job = Job(
        id='1',
        organization_id='org1',
        type='SCORE_TOURNAMENT_PERFORMANCE',
        status='QUEUED',
        payload={'aiScore': 7.8, 'humanScores': [8.0, 8.2, 7.9], 'confidence': 0.82},
    )
    result = process_job(job)
    assert result.status == 'COMPLETED'
    assert result.result['officialSource'] == 'HUMAN_PANEL_AVERAGE'
    assert abs(result.result['officialScore'] - 8.033) < 0.01
    assert result.result['provenance']['panelMedian'] == 8.0


def test_tournament_requires_review_when_low_confidence_without_human_panel():
    job = Job(
        id='1b',
        organization_id='org1',
        type='SCORE_TOURNAMENT_PERFORMANCE',
        status='QUEUED',
        payload={'aiScore': 7.1, 'confidence': 0.52},
    )
    result = process_job(job)
    assert result.status == 'NEEDS_HUMAN_REVIEW'
    assert 'Collect human panel scores' in result.result['recommendedAction']


def test_analysis_low_confidence_needs_human_review():
    job = Job(
        id='2',
        organization_id='org1',
        type='ANALYZE_STUDENT_SUBMISSION',
        status='QUEUED',
        payload={'quality': 0.4, 'confidence': 0.45, 'productMode': 'TRAINING_MODE'},
    )
    result = process_job(job)
    assert result.status == 'NEEDS_HUMAN_REVIEW'
    assert 'recommendedAction' in result.result


def test_unsupported_job_fails():
    job = Job(
        id='3',
        organization_id='org1',
        type='UNKNOWN_JOB',
        status='QUEUED',
        payload={},
    )
    result = process_job(job)
    assert result.status == 'FAILED'
    assert 'Unsupported job type' in result.error
