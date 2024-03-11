/**
 * 
 * This file serves as a temporary fix to overcome limitations in the automatic Types generation from cds-typer.
 * Properties which are associations, defined in projections, do not get added to the types, so this file adds them.
 * Over time, it needs to be assessed if this is still necessary, or it can be removed.
 * 
 * 2024-03-06:
 * @cap-js/cds-typer: 0.16.0
 * @cap-js/cds-types: 0.2.0
 * 
 */

import * as _db from '#cds-models/db'
import * as __ from '#cds-models/_'

import {
    BTPService,
    CommercialMetric,
    TechnicalMetric
} from '#cds-models/PresentationService'

export class ZCommercialMetric { }
export class ZCommercialMetrics extends Array<ZCommercialMetric> { }
export interface ZCommercialMetric extends __.Entity, CommercialMetric {
    cmByGlobalAccount?: __.Association.to<_db.CommercialMeasure>
    cmByDirectory?: __.Association.to.many<_db.CommercialMeasures>
    cmBySubAccount?: __.Association.to.many<_db.CommercialMeasures>
    cmByDatacenter?: __.Association.to.many<_db.CommercialMeasures>
}

export class ZTechnicalMetric { }
export class ZTechnicalMetrics extends Array<ZTechnicalMetric> { }
export interface ZTechnicalMetric extends __.Entity, TechnicalMetric {
    tmByGlobalAccount?: __.Association.to<_db.TechnicalMeasure>
    tmByDirectory?: __.Association.to.many<_db.TechnicalMeasures>
    tmBySubAccount?: __.Association.to.many<_db.TechnicalMeasures>
    tmByDatacenter?: __.Association.to.many<_db.TechnicalMeasures>
}

export class ZBTPService { }
export class ZBTPServices extends Array<ZBTPService> { }
export interface ZBTPService extends __.Entity, BTPService {
    // Commercial
    cmByGlobalAccount?: __.Association.to<_db.CommercialMeasure>
    cmByDirectory?: __.Association.to.many<_db.CommercialMeasures>
    cmBySubAccount?: __.Association.to.many<_db.CommercialMeasures>
    cmByDatacenter?: __.Association.to.many<_db.CommercialMeasures>

    // cmByMetricByGlobalAccount?: __.Association.to<_db.CommercialMeasure>
    cmByMetricByDirectory?: __.Association.to.many<_db.CommercialMeasures>
    cmByMetricBySubAccount?: __.Association.to.many<_db.CommercialMeasures>
    cmByMetricByDatacenter?: __.Association.to.many<_db.CommercialMeasures>

    // Technical
    tmByGlobalAccount?: __.Association.to<_db.TechnicalMeasure>
    // tmByDirectory?: __.Association.to.many<_db.TechnicalMeasures>
    // tmBySubAccount?: __.Association.to.many<_db.TechnicalMeasures>
    // tmByDatacenter?: __.Association.to.many<_db.TechnicalMeasures>

    // tmByMetricByGlobalAccount?: __.Association.to<_db.TechnicalMeasure>
    tmByMetricByDirectory?: __.Association.to.many<_db.TechnicalMeasures>
    tmByMetricBySubAccount?: __.Association.to.many<_db.TechnicalMeasures>
    tmByMetricByDatacenter?: __.Association.to.many<_db.TechnicalMeasures>
}
