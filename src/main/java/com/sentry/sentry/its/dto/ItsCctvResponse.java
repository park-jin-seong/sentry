package com.sentry.sentry.its.dto;

import java.util.List;

public record ItsCctvResponse(Response response) {
    public record Response(
            String coordtype,
            List<CctvItem> data,
            String datacount
    ) {}

    public record CctvItem(
            String roadsectionid,
            Double coordx,
            Double coordy,
            String cctvresolution,
            String filecreatetime,
            Integer cctvtype,
            String cctvformat,
            String cctvname,
            String cctvurl
    ) {}
}
