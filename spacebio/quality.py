"""Seed graph integrity checks; these checks do not biologically validate claims."""
from __future__ import annotations

import math
from typing import Any


def _is_finite_number(value: Any) -> bool:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return False
    try:
        return math.isfinite(float(value))
    except OverflowError:
        return False


def validate_seed(seed: Any) -> list[str]:
    """Return schema and graph-consistency errors for a browser seed."""
    errors: list[str] = []
    if not isinstance(seed, dict):
        return ['Seed must be a JSON object']

    collections = {
        'papers': seed.get('papers', []),
        'datasets': seed.get('datasets', []),
        'themes': seed.get('themes', []),
    }
    for field, value in collections.items():
        if not isinstance(value, list):
            errors.append(f'{field} must be a list')
    if errors:
        return errors

    papers = collections['papers']
    datasets = collections['datasets']
    themes = collections['themes']

    scope = seed.get('scope')
    if scope is not None:
        if not isinstance(scope, dict):
            errors.append('scope must be an object')
        else:
            for field in ('name', 'summary', 'status_note'):
                if not isinstance(scope.get(field), str) or not scope[field].strip():
                    errors.append(f'scope: missing {field}')

    paper_records = [record for record in papers if isinstance(record, dict)]
    dataset_records = [record for record in datasets if isinstance(record, dict)]
    theme_records = [record for record in themes if isinstance(record, dict)]
    if len(paper_records) != len(papers):
        errors.append('Each paper must be an object')
    if len(dataset_records) != len(datasets):
        errors.append('Each dataset must be an object')
    if len(theme_records) != len(themes):
        errors.append('Each theme must be an object')

    paper_ids = [record.get('id') for record in paper_records]
    dataset_ids = [record.get('id') for record in dataset_records]
    theme_name_values = [record.get('name') for record in theme_records]
    valid_paper_ids = [value for value in paper_ids if isinstance(value, str) and value.strip()]
    valid_dataset_ids = [value for value in dataset_ids if isinstance(value, str) and value.strip()]
    valid_theme_names = [value for value in theme_name_values if isinstance(value, str) and value.strip()]
    theme_names = set(valid_theme_names)

    if len(valid_paper_ids) != len(paper_ids):
        errors.append('Every paper needs a non-empty string ID')
    if len(valid_dataset_ids) != len(dataset_ids):
        errors.append('Every dataset needs a non-empty string ID')
    if len(set(valid_paper_ids)) != len(valid_paper_ids):
        errors.append('Duplicate paper ID')
    if len(set(valid_dataset_ids)) != len(valid_dataset_ids):
        errors.append('Duplicate dataset ID')
    if len(valid_theme_names) != len(theme_records):
        errors.append('Every theme needs a non-empty string name')
    if len(theme_names) != len(valid_theme_names):
        errors.append('Duplicate theme name')
    if not papers or not datasets:
        errors.append('Seed needs papers and datasets')

    for paper in paper_records:
        paper_id = paper.get('id', '?')
        for field in ('authors', 'title', 'finding', 'gap', 'validation'):
            if not isinstance(paper.get(field), str) or not paper[field].strip():
                errors.append(f'{paper_id}: missing {field}')
        for field in ('used', 'candidate', 'follows', 'buildsOn'):
            if not isinstance(paper.get(field), list):
                errors.append(f'{paper_id}: {field} must be a list')
        for field in ('x', 'y'):
            if not _is_finite_number(paper.get(field)):
                errors.append(f'{paper_id}: {field} must be a finite graph coordinate')
        paper_theme = paper.get('theme')
        if not isinstance(paper_theme, str) or paper_theme not in theme_names:
            errors.append(f'{paper_id}: theme not in theme list')

        for field in ('used', 'candidate'):
            references = paper.get(field, [])
            if not isinstance(references, list):
                continue
            for reference in references:
                if not isinstance(reference, dict):
                    errors.append(f'{paper_id}: {field} relationship must be an object')
                    continue
                if reference.get('id') not in dataset_ids:
                    errors.append(f'{paper_id}: unknown {field} dataset {reference.get("id")}')
                if field == 'candidate' and not str(reference.get('screen') or '').strip():
                    errors.append(f'{paper_id}: proposed dataset lacks screening status')

        for field in ('follows', 'buildsOn'):
            references = paper.get(field, [])
            if not isinstance(references, list):
                continue
            for reference in references:
                if not isinstance(reference, dict):
                    errors.append(f'{paper_id}: {field} relationship must be an object')
                    continue
                if reference.get('id') not in paper_ids:
                    errors.append(f'{paper_id}: unknown {field} paper {reference.get("id")}')

    for dataset in dataset_records:
        dataset_id = dataset.get('id', '?')
        for field in ('usedBy', 'candidateFor'):
            if not isinstance(dataset.get(field), list):
                errors.append(f'{dataset_id}: {field} must be a list')
        for field in ('x', 'y'):
            if not _is_finite_number(dataset.get(field)):
                errors.append(f'{dataset_id}: {field} must be a finite graph coordinate')
        dataset_theme = dataset.get('theme')
        if not isinstance(dataset_theme, str) or dataset_theme not in theme_names:
            errors.append(f'{dataset_id}: theme not in theme list')
        if not isinstance(dataset.get('url'), str) or not dataset['url'].strip():
            errors.append(f'{dataset_id}: missing dataset URL')
        role = dataset.get('role')
        if role is not None and (not isinstance(role, str) or not role.strip()):
            errors.append(f'{dataset_id}: role must be a non-empty string when provided')

        for field, reference_key in (('usedBy', 'paper'), ('candidateFor', 'paper')):
            references = dataset.get(field, [])
            if not isinstance(references, list):
                continue
            for reference in references:
                if not isinstance(reference, dict):
                    errors.append(f'{dataset_id}: {field} relationship must be an object')
                    continue
                if reference.get(reference_key) not in paper_ids:
                    label = 'citing' if field == 'usedBy' else 'proposed'
                    errors.append(f'{dataset_id}: unknown {label} paper {reference.get(reference_key)}')

    for theme in theme_records:
        name = theme.get('name', '?')
        for field in ('x', 'y'):
            if not _is_finite_number(theme.get(field)):
                errors.append(f'{name}: theme {field} must be a finite coordinate')
        for field in ('rx', 'ry'):
            if not _is_finite_number(theme.get(field)) or theme[field] <= 0:
                errors.append(f'{name}: theme {field} must be a positive number')
        for field in ('icon', 'tint', 'accent', 'dark'):
            if not isinstance(theme.get(field), str) or not theme[field].strip():
                errors.append(f'{name}: theme missing {field}')

    for field in ('width', 'height', 'cardW', 'cardH'):
        if not _is_finite_number(seed.get(field)) or seed[field] <= 0:
            errors.append(f'{field} must be a positive number')

    totals = seed.get('totals', {})
    if not isinstance(totals, dict):
        errors.append('totals must be an object')
    else:
        expected = {
            'papers': len(papers),
            'datasets': len(datasets),
            'usedLinks': sum(len(paper.get('used', [])) for paper in paper_records if isinstance(paper.get('used'), list)),
            'candidateLinks': sum(len(paper.get('candidate', [])) for paper in paper_records if isinstance(paper.get('candidate'), list)),
            'followupLinks': sum(len(paper.get('follows', [])) for paper in paper_records if isinstance(paper.get('follows'), list)),
        }
        for field, value in expected.items():
            if totals.get(field) != value:
                errors.append(f'totals.{field} should be {value}')

    # A graph can be logically consistent and still be scientifically inaccurate.
    return errors




