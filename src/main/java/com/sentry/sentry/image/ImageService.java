package com.sentry.sentry.image;

import com.hierynomus.mssmb2.SMB2CreateDisposition;
import com.hierynomus.mssmb2.SMB2ShareAccess;
import com.hierynomus.msdtyp.AccessMask;
import com.hierynomus.smbj.SMBClient;
import com.hierynomus.smbj.auth.AuthenticationContext;
import com.hierynomus.smbj.connection.Connection;
import com.hierynomus.smbj.session.Session;
import com.hierynomus.smbj.share.DiskShare;
import com.hierynomus.smbj.share.File;
import com.sentry.sentry.entity.EventResult;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.EnumSet;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ImageService {

    private final EventResultRepository eventResultRepository;

    @Value("${smb.username}")
    private String smbUsername;

    @Value("${smb.password}")
    private String smbPassword;

    @Value("${smb.domain:}")
    private String smbDomain;

    public Optional<InputStream> getImageStreamFromSmb(Long eventResultId) {
        Optional<EventResult> eventResultOpt = eventResultRepository.findById(eventResultId);

        if (eventResultOpt.isEmpty()) {
            return Optional.empty();
        }

        String smbPath = eventResultOpt.get().getThumbnailPath();
        smbPath = smbPath.replaceAll("[^\\x00-\\x7F]", "");


        String host = smbPath.substring(2, smbPath.indexOf('\\', 2));
        String shareAndPath = smbPath.substring(host.length() + 3);
        String shareName = shareAndPath.substring(0, shareAndPath.indexOf('\\'));
        String filePath = shareAndPath.substring(shareName.length() + 1);

        try (SMBClient client = new SMBClient();
             Connection connection = client.connect(host);

             Session session = connection.authenticate(new AuthenticationContext("keduit", "123$".toCharArray(), null))) {

            DiskShare disk = (DiskShare) session.connectShare(shareName);

            if (!disk.fileExists(filePath)) {
                return Optional.empty();
            }

            File smbFile = disk.openFile(
                    filePath,
                    EnumSet.of(AccessMask.GENERIC_READ),
                    EnumSet.noneOf(com.hierynomus.msfscc.FileAttributes.class),
                    EnumSet.of(SMB2ShareAccess.FILE_SHARE_READ),
                    SMB2CreateDisposition.FILE_OPEN,
                    null);

            InputStream inputStream = smbFile.getInputStream();
            return Optional.of(inputStream);
        } catch (Exception e) {
            System.out.println(">>>>>>>>>>>>>>>>>>>>>>>>" + e.getMessage());
            return Optional.empty();
        }
    }
}