export interface DietRecord {
    date: string;
    weight: number;
    change: string;
    note?: string;
}

export const dietHistory: DietRecord[] = [
    { date: '2024-08-26', weight: 110.5, change: '0.0 (시작)', note: '특별한 계기 없이, 그저 해보고 싶어서 시작 (목표 65kg)' },
    { date: '2024-08-27', weight: 108.9, change: '-1.6', note: '초반 급속 감량 (수분 손실 추정)' },
    { date: '2024-08-28', weight: 108.6, change: '-1.9' },
    { date: '2024-08-29', weight: 108.4, change: '-2.1' },
    { date: '2024-08-30', weight: 109.8, change: '-0.7', note: '초코파이/맥주 섭취로 인한 반등' },
    { date: '2024-08-31', weight: 110.4, change: '-0.1' },
    { date: '2024-09-01', weight: 110.2, change: '-0.3' },
    { date: '2024-09-10', weight: 109.0, change: '-1.5' },
    { date: '2024-09-14', weight: 108.5, change: '-2.0', note: '저녁 집중 식사 패턴 실험' },
    { date: '2024-09-21', weight: 107.8, change: '-2.7' },
    { date: '2024-10-01', weight: 107.3, change: '-3.2', note: '1일 1식 패턴 도입 시도' },
    { date: '2024-10-12', weight: 107.7, change: '-2.8' },
    { date: '2024-10-15', weight: 108.1, change: '-2.4', note: '간식(찹쌀떡) 통제 실패' },
    { date: '2024-10-21', weight: 106.6, change: '-3.9' },
    { date: '2024-10-23', weight: 107.1, change: '-3.4' },
    { date: '2024-10-25', weight: 106.2, change: '-4.3', note: '다이어트 리듬 찾기 시작' },
    { date: '2024-11-18', weight: 108.2, change: '-2.3', note: '1일 1식의 한계, 1.5식으로 조정' },
    { date: '2024-12-29', weight: 111.3, change: '+0.8', note: '관리 중단 및 방심으로 역대 최고 몸무게 갱신 (요요)' },
    { date: '2025-01-24', weight: 107.1, change: '-3.4', note: '재시작: 1일 1식 재도입 (퇴근=단식)' },
    { date: '2025-02-05', weight: 106.2, change: '-4.3' },
    { date: '2025-02-11', weight: 105.4, change: '-5.1', note: '완벽한 1끼가 아니어도 감량됨을 확인' },
    { date: '2025-02-12', weight: 105.1, change: '-5.4', note: '내 몸의 법칙 수용 ("많이 먹으면 찐다")' },
    { date: '2025-02-22', weight: 104.5, change: '-6.0' },
    { date: '2025-02-24', weight: 104.0, change: '-6.5' },
    { date: '2025-02-28', weight: 102.7, change: '-7.8', note: '감량 가속화 (2월 -4.4kg)' },
    { date: '2025-03-14', weight: 104.7, change: '-5.8', note: '일시적 폭식 (+2kg)' },
    { date: '2025-04-09', weight: 103.3, change: '-7.2', note: '수면/식사 패턴의 정형화 완료' },
    { date: '2025-05-03', weight: 100.9, change: '-9.6' },
    { date: '2025-05-20', weight: 97.75, change: '-12.75', note: '드디어 두 자리수 진입 (90kg대)' },
    { date: '2025-05-26', weight: 96.9, change: '-13.6', note: '하루 1끼 반 공기 원칙 확립' },
    { date: '2025-06-23', weight: 94.3, change: '-16.2', note: '1일 1식이 완전히 적응됨' },
    { date: '2025-07-15', weight: 93.9, change: '-16.6' },
    { date: '2025-07-23', weight: 93.5, change: '-17.0', note: '다이어트가 고통이 아닌 선택의 영역이 됨' },
    { date: '2025-08-27', weight: 93.85, change: '-16.65' },
    { date: '2025-09-19', weight: 98.5, change: '-12.0', note: '이유 없는 폭식과 배달 음식으로 요요 (+5kg)' },
    { date: '2025-11-05', weight: 99.6, change: '-10.9', note: '다시 다이어트 욕구 확인 및 재시작' },
    { date: '2025-11-26', weight: 94.9, change: '-15.6', note: '참회의 48시간 단식으로 급속 복구' },
    { date: '2025-11-27', weight: 94.45, change: '-16.05', note: '단식 효과 데이터 확인 및 안정화' },
];
