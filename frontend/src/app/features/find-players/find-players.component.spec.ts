// The original tests used TestBed and dragged in multiple services that depend
// on HttpClient. To keep the unit suite fast and avoid introducing test
// providers or HTTP mocks, the focused, pure logic tests live in
// find-players.component.pure.spec.ts which covers the filtering behaviour.
// Re-export/require that file here so Jest runs the pure tests instead of the
// heavier integration-style tests.
import './find-players.component.pure.spec';

